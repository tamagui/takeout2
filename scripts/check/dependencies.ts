#!/usr/bin/env bun

import { cmd } from '@o/cli'

await cmd`Check for circular dependencies`.run(async ({ $ }) => {
  await $`oxlint --import-plugin --type-aware --deny import/no-cycle app/ src/`
})
