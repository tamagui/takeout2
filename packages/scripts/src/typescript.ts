#!/usr/bin/env bun

/**
 * @description Run TypeScript compiler for type checking
 */

import { run } from '@tamatko/scripts/helpers/run'

const useTsgo = process.env.TSGO === '1'
const args = process.argv.slice(2)

if (useTsgo) {
  await run(`bun tsgo --project ./tsconfig.json --noEmit --preserveWatchOutput ${args}`)
} else {
  await run(`tsc --project ./tsconfig.json --noEmit --preserveWatchOutput ${args}`)
}
