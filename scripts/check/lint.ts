#!/usr/bin/env bun

/**
 * @description Run oxlint linter
 * @args --fix
 */

import { parseArgs } from 'node:util'

import { $ } from 'bun'

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    fix: { type: 'boolean' },
  },
})

if (values.fix) {
  await $`oxfmt && oxlint --fix --fix-suggestions`
} else {
  await $`oxlint`
}
