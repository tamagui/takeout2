#!/usr/bin/env bun

import { cmd } from '@take-out/cli'

await cmd`Run TypeScript type checking`
  .args('--watch boolean')
  .run(async ({ args, $ }) => {
    const { existsSync } = await import('node:fs')

    async function checkProjectTypes() {
      if (args.watch) {
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
  })
