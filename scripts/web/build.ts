#!/usr/bin/env bun

import { cmd } from '@take-out/cli'

await cmd`Build web platform`.run(async ({ $ }) => {
  await $`bun run:prod one build --platform=web`
})
