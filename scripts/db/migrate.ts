#!/usr/bin/env bun

import { cmd } from '@take-out/cli'

await cmd`Build and run database migrations`.run(async ({ $ }) => {
  await $`bun tko db build`
  await $`RUN=1 bun ./src/database/migrate-dist.js`
})
