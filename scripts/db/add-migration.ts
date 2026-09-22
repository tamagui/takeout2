#!/usr/bin/env bun

import { cmd } from '@o/cli'

await cmd`Add a new database migration`.run(async ({ path }) => {
  const { addMigration } = await import('@o/database/scripts/migration-add')

  const name = process.argv[2]
  const migrationsDir = path.join(process.cwd(), 'src/database/migrations')
  addMigration({ migrationsDir, name })
})
