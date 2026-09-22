#!/usr/bin/env bun

import { cmd } from '@o/cli'

await cmd`Start backend services for CI`.run(async ({ run }) => {
  const { getTestEnv } = await import('@o/scripts/helpers/get-test-env')

  if (!process.env.SKIP_BACKEND_CLEAN) {
    await run(`bun backend:clean`, {
      env: await getTestEnv(),
    })
  }

  await run(`bun backend --no-color`, {
    env: await getTestEnv(),
  })
})
