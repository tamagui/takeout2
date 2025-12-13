#!/usr/bin/env bun

/**
 * @description Start frontend in production mode for CI
 */

import { getTestEnv } from '@take-out/scripts/helpers/get-test-env'
import { run } from '@take-out/scripts/helpers/run'

const testEnv = await getTestEnv()

await run(`bun run web serve`, {
  prefix: 'web-serve',
  env: {
    ...testEnv,
    IS_TESTING: '1',
    ONE_SERVER_URL: 'http://localhost:8081',
    BETTER_AUTH_URL: 'http://localhost:8081',
  },
})
