#!/usr/bin/env bun

/**
 * @description Build development profile for all platforms
 * @args --android, --ios
 */

import { $ } from 'bun'
import { parseArgs } from 'node:util'

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    android: { type: 'boolean' },
    ios: { type: 'boolean' },
  },
})

const platform = values.android ? 'android' : values.ios ? 'ios' : 'all'
await $`eas build --profile development --platform ${platform}`
