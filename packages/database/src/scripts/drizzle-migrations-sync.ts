#!/usr/bin/env bun

/**
 * drizzle-kit v1 beta generates migrations as directories:
 *   YYYYMMDDHHMMSS_name/migration.sql + snapshot.json
 *
 * our migration runner uses loadMigrationsFromDir which only
 * finds flat .ts files. this script creates a flat .ts wrapper for each
 * directory migration so the runner can pick them up.
 *
 * the wrapper inlines the SQL as a string constant (no ?raw import needed)
 * which makes it work with both vite and bun.
 */

import { existsSync } from 'node:fs'
import { readdir, readFile, writeFile, stat } from 'node:fs/promises'
import { join } from 'node:path'

export type DrizzleSyncOptions = {
  migrationsDir: string
}

export async function syncDrizzleMigrations(options: DrizzleSyncOptions) {
  const { migrationsDir } = options
  const entries = await readdir(migrationsDir, { withFileTypes: true })

  // find directory-format migrations (contain migration.sql)
  const migrationDirs = entries.filter(
    (e) => e.isDirectory() && e.name !== 'meta' && e.name !== 'node_modules',
  )

  let created = 0
  let updated = 0

  for (const dir of migrationDirs) {
    const sqlPath = join(migrationsDir, dir.name, 'migration.sql')
    if (!existsSync(sqlPath)) continue

    const sql = await readFile(sqlPath, 'utf-8')
    const trimmed = sql.trim()

    if (!trimmed || trimmed.startsWith('-- seed')) {
      continue
    }

    const wrapperPath = join(migrationsDir, `${dir.name}.ts`)

    // check if wrapper already exists and is up to date
    if (existsSync(wrapperPath)) {
      const sqlMtime = (await stat(sqlPath)).mtimeMs
      const tsMtime = (await stat(wrapperPath)).mtimeMs
      if (tsMtime > sqlMtime) continue
      updated++
    } else {
      created++
    }

    // generate wrapper with inlined SQL
    const escaped = trimmed
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\$/g, '\\$')
    const content = `import type { PoolClient } from 'pg'

const sql = \`${escaped}\`

export async function up(client: PoolClient) {
  for (const stmt of sql.split('--> statement-breakpoint')) {
    const trimmed = stmt.trim()
    if (trimmed) await client.query(trimmed)
  }
}
`

    await writeFile(wrapperPath, content)
  }

  if (created > 0) console.info(`created ${created} migration wrapper(s)`)
  if (updated > 0) console.info(`updated ${updated} migration wrapper(s)`)
  if (created === 0 && updated === 0) console.info('migration wrappers up to date')
}
