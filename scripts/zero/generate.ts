#!/usr/bin/env bun

/**
 * @description Generate Zero sync code
 */

import { args } from '@take-out/scripts/helpers/args'
import { $ } from 'bun'

const { watch } = args('--watch boolean')

const afterCmd = 'bunx oxfmt src/data/generated'

if (watch) {
  await $`bun over-zero generate --watch --after ${afterCmd}`
} else {
  await $`bun over-zero generate --after ${afterCmd}`
}
