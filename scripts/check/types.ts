#!/usr/bin/env bun

/**
 * @description Run TypeScript type checking
 * @args --watch
 */

import { $ } from 'bun'
import { existsSync } from 'node:fs'
import { parseArgs } from 'node:util'

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    watch: { type: 'boolean' },
  },
})

async function checkProjectTypes() {
  if (values.watch) {
    await $`TSGO=1 tko run typecheck --watch`
  } else {
    await $`TSGO=1 tko run typecheck`
  }
}

async function checkPackagesTypes() {
  if (existsSync('./packages')) {
    await $`bun tko run --no-root typecheck`
  }
}

await Promise.all([checkProjectTypes(), checkPackagesTypes()])
