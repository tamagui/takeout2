#!/usr/bin/env bun

import { cmd } from '@take-out/cli'

await cmd`Deploy hot update for Android`.run(async ({ $ }) => {
  await $`bunx hot-updater deploy --platform android ${process.argv.slice(2)}`
})
