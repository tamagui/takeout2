#!/usr/bin/env bun

import { cmd } from '@take-out/cli'

await cmd`Build production profile for all platforms`.run(async ({ $ }) => {
  await $`eas build --profile production --platform all`
})
