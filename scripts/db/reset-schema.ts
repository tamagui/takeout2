#!/usr/bin/env bun

import { cmd } from '@take-out/cli'

await cmd`Reset migrations to a fresh state from current schema files`.run(
  async ({ fs, path }) => {
    const { spawnSync } = await import('node:child_process')
    const { fileURLToPath } = await import('node:url')

    const __dirname = path.dirname(fileURLToPath(import.meta.url))
    const rootDir = path.join(__dirname, '../..')
    const migrationsDir = path.join(rootDir, 'src/database/migrations')

    console.info('\n⚠️  WARNING: This will delete all existing migrations!')
    console.info('Only use this if you have modified the schema and want a fresh start.')
    console.info(
      'Your database should be empty or you should drop/recreate it after this.\n'
    )

    // prompt for confirmation
    const rl = await import('node:readline')
    const readline = rl.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    const answer = await new Promise<string>((resolve) => {
      readline.question('Continue? (y/N): ', resolve)
    })
    readline.close()

    if (answer.toLowerCase() !== 'y') {
      console.info('Cancelled.')
      process.exit(0)
    }

    console.info('\n1. Clearing existing migrations...')

    // delete all files in migrations dir except meta folder initially
    if (fs.existsSync(migrationsDir)) {
      const files = await fs.promises.readdir(migrationsDir)
      for (const file of files) {
        const filePath = path.join(migrationsDir, file)
        await fs.promises.rm(filePath, { recursive: true })
      }
    }

    console.info('2. Generating fresh migration from schema...')

    const result = spawnSync(
      'bunx',
      ['drizzle-kit', 'generate', '--config=src/database/drizzle.config.ts'],
      {
        cwd: rootDir,
        stdio: 'inherit',
      }
    )

    if (result.status !== 0) {
      console.error('Failed to generate migration')
      process.exit(1)
    }

    console.info('3. Renaming to 0001_initial_schema...')

    // find the generated file (drizzle uses 0000_random_name.sql)
    const newFiles = (await fs.promises.readdir(migrationsDir)).filter((f) =>
      f.endsWith('.sql')
    )
    if (newFiles.length !== 1) {
      console.error('Expected exactly one SQL file, found:', newFiles)
      process.exit(1)
    }

    const generatedFile = newFiles[0]!
    const newSqlPath = path.join(migrationsDir, '0001_initial_schema.sql')

    await fs.promises.rename(path.join(migrationsDir, generatedFile), newSqlPath)

    // update the journal
    const journalPath = path.join(migrationsDir, 'meta/_journal.json')
    if (fs.existsSync(journalPath)) {
      const journal = JSON.parse(await fs.promises.readFile(journalPath, 'utf-8'))
      if (journal.entries?.[0]) {
        journal.entries[0].tag = '0001_initial_schema'
      }
      await fs.promises.writeFile(journalPath, JSON.stringify(journal, null, 2))
    }

    // rename snapshot
    const metaDir = path.join(migrationsDir, 'meta')
    const snapshots = (await fs.promises.readdir(metaDir)).filter((f) =>
      f.endsWith('_snapshot.json')
    )
    if (snapshots.length === 1) {
      await fs.promises.rename(
        path.join(metaDir, snapshots[0]!),
        path.join(metaDir, '0001_snapshot.json')
      )
    }

    // create TS wrapper using ?raw import for bundling
    console.info('4. Creating TypeScript wrapper...')

    const tsWrapper = `import sql from './0001_initial_schema.sql?raw'

import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  const statements = sql.split('--> statement-breakpoint')
  for (const statement of statements) {
    const trimmed = statement.trim()
    if (trimmed) {
      await client.query(trimmed)
    }
  }
}
`

    await fs.promises.writeFile(
      path.join(migrationsDir, '0001_initial_schema.ts'),
      tsWrapper
    )

    console.info('\n✅ Done! Your migrations have been reset.')
    console.info('\nNext steps:')
    console.info(
      '  1. If you have custom triggers or functions, add them to the .sql file'
    )
    console.info('  2. Drop and recreate your database (or use a fresh one)')
    console.info('  3. Run: bun db:migrate')
  }
)
