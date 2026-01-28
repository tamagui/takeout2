#!/usr/bin/env bun

/**
 * @description Run TypeScript type checking
 * @args --watch
 */

import { existsSync } from 'node:fs'

import { args } from '@take-out/scripts/helpers/args'
import { $ } from 'bun'

const { watch } = args('--watch boolean')

async function checkProjectTypes() {
  if (watch) {
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
