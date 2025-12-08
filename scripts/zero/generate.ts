#!/usr/bin/env bun

/**
 * @description Generate Zero sync code
 */

import { parseArgs } from 'node:util'

import { $ } from 'bun'

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    watch: { type: 'boolean', short: 'w' },
  },
})

const afterCmd = 'bunx oxfmt src/data/generated'

if (values.watch) {
  await $`bun over-zero generate --watch --after ${afterCmd}`
} else {
  await $`bun over-zero generate --after ${afterCmd}`
}
