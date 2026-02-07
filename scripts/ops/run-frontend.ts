#!/usr/bin/env bun
import { cmd } from '@take-out/cli'

await cmd`Start frontend in production mode for CI`.run(async ({ run }) => {
  const { getTestEnv } = await import('@take-out/scripts/helpers/get-test-env')
  const testEnv = await getTestEnv()

  await run(`bun run web serve`, {
    prefix: 'web-serve',
    env: {
      ...testEnv,
      IS_TESTING: '1',
    },
  })
})
