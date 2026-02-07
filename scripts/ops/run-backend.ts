#!/usr/bin/env bun
import { cmd } from '@take-out/cli'

await cmd`Start backend services for CI`.run(async ({ run }) => {
  const { getTestEnv } = await import('@take-out/scripts/helpers/get-test-env')
  await run(`bun backend:clean`)
  await run(`bun backend --no-color`, {
    env: await getTestEnv(),
  })
})
