import { sql } from '~/database/helpers'
import { handleError } from '~/features/errors/handleError'
import { ZERO_UPSTREAM_DB } from '~/server/env-server'

import { migrations } from './migrations'

const ZERO_MIGRATION_PREFIX = `zero-migration-`

export async function initializeZeroMigrations() {
  // skip migrations if database URL is a placeholder (e.g. during SSG builds)
  if (
    !ZERO_UPSTREAM_DB ||
    ZERO_UPSTREAM_DB.includes('@host:') ||
    ZERO_UPSTREAM_DB.includes('your-')
  ) {
    console.info('[zero.migrate] skipping - database URL not configured')
    return
  }
  // validate migrations versions numbers are incrementing:
  let lastVersion = -1
  const existingVersions = new Set<number>()
  for (const [index, migration] of migrations.entries()) {
    if (lastVersion === -1) {
      lastVersion = migration.version
      continue
    }
    if (migration.version <= lastVersion || existingVersions.has(migration.version)) {
      console.error(
        `[zero.migrate] ❌ Error: Zero migration at index ${index} version is not greater than last or duplicate of previous migration`
      )
      process.exit(1)
    }
    lastVersion = migration.version
    existingVersions.add(migration.version)
  }

  try {
    const completedMigrationsResult = await sql`
      SELECT name FROM migrations
      WHERE name LIKE ${ZERO_MIGRATION_PREFIX + '%'}
      ORDER BY name DESC
    `

    const completedVersions = new Set(
      completedMigrationsResult.rows.map((row: { name: string }) => {
        const version = row.name.replace(ZERO_MIGRATION_PREFIX, '')
        return Number.parseInt(version, 10)
      })
    )

    const highestCompletedVersion =
      completedVersions.size > 0 ? Math.max(...completedVersions) : -1

    const migrationsToRun = migrations.filter((m) => m.version > highestCompletedVersion)

    console.info(
      `[zero.migrate] at version ${highestCompletedVersion}, ${migrations.length} total migrations, ${migrationsToRun.length} left to run`
    )

    if (migrationsToRun.length === 0) {
      return
    }

    console.info(
      `[zero.migrate] v${highestCompletedVersion} → v${Math.max(...migrationsToRun.map((m) => m.version))}`
    )

    for (const migration of migrationsToRun) {
      console.info(`[zero.migrate] running v${migration.version} (${migration.name})`)

      try {
        await migration.run()

        await sql`
          INSERT INTO migrations (name)
          VALUES (${ZERO_MIGRATION_PREFIX + migration.version})
        `

        console.info(`[zero.migrate] ✅ v${migration.version} (${migration.name})`)
      } catch (error) {
        console.error(
          `[zero.migrate] ❌ v${migration.version} (${migration.name})`,
          error
        )
        handleError(error instanceof Error ? error : new Error(String(error)))
        break
      }
    }

    console.info('[zero.migrate] ✨ complete')
  } catch (error) {
    console.error('[zero.migrate] ❌ failed', error)
    handleError(error instanceof Error ? error : new Error(String(error)))
  }
}
