#!/usr/bin/env bun

import { cmd } from '@o/cli'

await cmd`Run knip to find unused dependencies and exports`.run(async ({ $ }) => {
  await $`bunx knip`.nothrow()
})
