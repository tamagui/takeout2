#!/usr/bin/env bun

import { cmd } from '@take-out/cli'

await cmd`Generate Zero sync code`.args('--watch boolean').run(async ({ args, $ }) => {
  const afterCmd = 'bunx oxfmt src/data/generated'

  if (args.watch) {
    await $`bun on-zero generate --watch --after ${afterCmd}`
  } else {
    await $`bun on-zero generate --after ${afterCmd}`
  }
})
