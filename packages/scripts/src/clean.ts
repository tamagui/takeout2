#!/usr/bin/env bun

import { cmd } from './cmd'

await cmd`clean build artifacts and temporary files`
  .args('--full boolean --modules boolean --native boolean')
  .run(async ({ args, $ }) => {
    const full = args.full
    const modules = full || args.modules
    const native = full || args.native

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
  })
