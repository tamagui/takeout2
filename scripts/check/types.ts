#!/usr/bin/env bun

/**
 * @description Run TypeScript type checking
 * @args --watch
 */

import { $ } from 'bun'
import { parseArgs } from 'node:util'

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    watch: { type: 'boolean' },
  },
})

if (values.watch) {
  await $`TSGO=1 tko run typescript --watch`
} else {
  await $`TSGO=1 tko run typescript`
}
