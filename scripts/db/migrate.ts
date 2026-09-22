#!/usr/bin/env bun

import { cmd } from '@o/cli'

await cmd`Build and run database migrations`.run(async ({ $ }) => {
  // generate SQL + sync .ts wrappers from schema
  await $`tko db build`

  // run pending migrations against the db
  await $`bun ./src/database/migrate.ts`
})
