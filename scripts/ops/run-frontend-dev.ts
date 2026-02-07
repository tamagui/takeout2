#!/usr/bin/env bun
import { cmd } from '@take-out/cli'

await cmd`Start frontend in dev mode for CI/testing`.run(async ({ run }) => {
  const { getTestEnv } = await import('@take-out/scripts/helpers/get-test-env')
  const testEnv = await getTestEnv()

  await run(`bun one:dev`, {
    prefix: 'web-dev',
    env: {
      ...testEnv,
      IS_TESTING: '1',
      DISABLE_METRO: '1', // not testing native here
    },
  })
})
