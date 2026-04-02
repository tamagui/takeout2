#!/usr/bin/env bun

import { cmd } from '@take-out/cli'

await cmd`Build migrations for production (generates SQL + bundles for docker)`.run(
  async ({ $ }) => {
    // generate drizzle SQL from schema
    await $`bun drizzle-kit generate --config ./src/database/drizzle.config.ts`

    // sync directory migrations to flat .ts wrappers
    const { syncDrizzleMigrations } = await import('../migrate/sync-drizzle')
    await syncDrizzleMigrations()

    console.info('✅ migrations built')
  },
)
