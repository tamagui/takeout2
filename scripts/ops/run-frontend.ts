#!/usr/bin/env bun

import { cmd } from '@take-out/cli'

await cmd`Start frontend in production mode for CI`
  .args('--dev boolean')
  .run(async ({ args, run }) => {
    const { getTestEnv } = await import('@take-out/scripts/helpers/get-test-env')
    const testEnv = await getTestEnv()

    if (args.dev) {
      await run(`bun one:dev`, {
        prefix: 'web-dev',
        env: {
          ...testEnv,
          IS_TESTING: '1',
          DISABLE_METRO: '1',
        },
      })
      return
    }

    await run(`bun run web serve`, {
      prefix: 'web-serve',
      env: {
        ...testEnv,
        IS_TESTING: '1',
      },
    })
  })
