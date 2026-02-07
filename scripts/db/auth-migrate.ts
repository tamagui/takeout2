#!/usr/bin/env bun

import { cmd } from '@take-out/cli'

await cmd`Run better-auth database migrations`.run(async ({ $ }) => {
  await $`bunx better-auth/cli migrate ${process.argv.slice(2)}`
})
