#!/usr/bin/env bun

/**
 * @description Run biome linter
 * @args --fix
 */

import { $ } from 'bun'
import { parseArgs } from 'node:util'

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    fix: { type: 'boolean' },
  },
})

if (values.fix) {
  await $`biome check --fix --unsafe`
} else {
  await $`biome check`
}
