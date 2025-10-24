#!/usr/bin/env bun

import { run } from './helpers/run'

const useTsgo = process.env.TSGO === '1'
const args = process.argv.slice(2)

if (useTsgo) {
  await run(`bun tsgo --project ./tsconfig.json --noEmit --preserveWatchOutput ${args}`)
} else {
  await run(`tsc --project ./tsconfig.json --noEmit --preserveWatchOutput ${args}`)
}
