#!/usr/bin/env bun

import { cmd } from '@take-out/cli'

await cmd`Deploy hot update for iOS`.run(async ({ $ }) => {
  await $`bunx hot-updater deploy --platform ios ${process.argv.slice(2)}`
})
