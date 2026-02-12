#!/usr/bin/env bun

// @description Run unit tests only

import { cmd } from '@take-out/cli'

await cmd`Run unit tests`.run(async ({ $ }) => {
  await $`bun run test:unit`
})
