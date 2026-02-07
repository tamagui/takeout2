#!/usr/bin/env bun

import { cmd } from '@take-out/cli'

await cmd`Build development profile for all platforms`
  .args('--android boolean --ios boolean')
  .run(async ({ args, $ }) => {
    const platform = args.android ? 'android' : args.ios ? 'ios' : 'all'
    await $`eas build --profile development --platform ${platform}`
  })
