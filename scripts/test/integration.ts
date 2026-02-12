#!/usr/bin/env bun

// @description Run integration tests only

import { cmd } from '@take-out/cli'

await cmd`Run integration tests`.run(async ({ $ }) => {
  await $`bun run test:integration`
})
