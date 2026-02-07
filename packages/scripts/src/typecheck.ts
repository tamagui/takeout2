#!/usr/bin/env bun

import { cmd } from './cmd'

await cmd`run typescript type checking`.run(async ({ run }) => {
  const { sleep } = await import('@take-out/helpers')

  const useTsgo = process.env.TSGO === '1'
  const args = process.argv.slice(2)

  // hugely cpu intensive, let the dev server start first before using:
  if (process.env.LAZY_TYPECHECK) {
    await sleep(6000)
  }

  if (useTsgo) {
    await run(`bun tsgo --project ./tsconfig.json --noEmit --preserveWatchOutput ${args}`)
  } else {
    await run(`bun tsc --project ./tsconfig.json --noEmit --preserveWatchOutput ${args}`)
  }
})
