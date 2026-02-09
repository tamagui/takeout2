#!/usr/bin/env bun

import { cmd } from '@take-out/cli'

await cmd`Start backend services for CI`.run(async ({ run }) => {
  const { getTestEnv } = await import('@take-out/scripts/helpers/get-test-env')

  if (!process.env.SKIP_BACKEND_CLEAN) {
    await run(`bun backend:clean`, {
      env: await getTestEnv(),
    })
  }

  await run(`bun backend --no-color`, {
    env: await getTestEnv(),
  })
})
