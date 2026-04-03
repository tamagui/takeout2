#!/usr/bin/env bun

import { cmd } from '@take-out/cli'

await cmd`Build and run database migrations`.run(async ({ $ }) => {
  await $`bun ./src/database/migrate.ts`
})
