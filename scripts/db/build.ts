#!/usr/bin/env bun

import { cmd } from '@take-out/cli'

await cmd`Build migrations for production (generates SQL + bundles for docker)`.run(
  async ({ $ }) => {
    // generate drizzle SQL from schema
    await $`bun drizzle-kit generate --config ./src/database/drizzle.config.ts`

    // sync directory migrations to flat .ts wrappers
    const { syncDrizzleMigrations } = await import('@take-out/database/scripts/drizzle-migrations-sync')
    await syncDrizzleMigrations({ migrationsDir: './src/database/migrations' })

    console.info('✅ migrations built')
  },
)
