#!/usr/bin/env bun

/**
 * @description Clean build artifacts and temporary files
 */

import { $ } from 'bun'

const full = process.argv.includes('--full')
const modules = full || process.argv.includes('--modules')
const native = full || process.argv.includes('--native')

await $`rm -rf dist types .tamagui .vite node_modules/.cache`

if (modules) {
  console.info('removing all node_modules...')
  await $`find . -name 'node_modules' -type d -prune -exec rm -rf {} +`
}

if (native) {
  console.info('removing ios and android folders...')
  await $`rm -rf ios android`
}

console.info('cleanup complete!')

if (!full) {
  console.info('use --modules, --native, or --full for deeper cleaning')
}
