#!/usr/bin/env bun

/**
 * @description Run TypeScript type checking
 * @args --watch
 */

import { existsSync } from 'node:fs'
import { parseArgs } from 'node:util'

import { $ } from 'bun'

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    watch: { type: 'boolean' },
  },
})

async function checkProjectTypes() {
  if (values.watch) {
    await $`LAZY_TYPECHECK=1 tko run typecheck --watch`
  } else {
    await $`tko run typecheck`
  }
}

async function checkPackagesTypes() {
  if (existsSync('./packages')) {
    await $`bun tko run --no-root typecheck`
  }
}

await Promise.all([checkProjectTypes(), checkPackagesTypes()])
