#!/usr/bin/env bun

import { cmd } from '@o/cli'

await cmd`Build preview profile for all platforms`.run(async ({ $ }) => {
  await $`eas build --profile preview --platform all`
})
