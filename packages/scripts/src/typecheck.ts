#!/usr/bin/env bun

/**
 * @description Run TypeScript compiler for type checking
 */

import { sleep } from '@take-out/helpers'
import { run } from '@take-out/scripts/helpers/run'

const useTsgo = process.env.TSGO === '1'
const args = process.argv.slice(2)

// hugely cpu intensive, let the dev server start first before using:
if (process.env.LAZY_TYPECHECK) {
  await sleep(6000)
}

if (useTsgo) {
  await run(`bun tsgo --project ./tsconfig.json --noEmit --preserveWatchOutput ${args}`)
} else {
  await run(`bun x tsc --project ./tsconfig.json --noEmit --preserveWatchOutput ${args}`)
}
