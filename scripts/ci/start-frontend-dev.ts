#!/usr/bin/env bun

/**
 * @description Start frontend in dev mode for CI/testing
 */

import { getTestEnv } from '@take-out/scripts/helpers/get-test-env'
import { run } from '@take-out/scripts/helpers/run'

const testEnv = await getTestEnv()

const port = process.env.PORT_WEB || '8081'
const serverUrl = `http://localhost:${port}`

await run(`bun one:dev`, {
  prefix: 'web-dev',
  env: {
    ...testEnv,
    IS_TESTING: '1',
    DISABLE_METRO: '1', // not testing native here
    ONE_SERVER_URL: serverUrl,
    BETTER_AUTH_URL: serverUrl,
  },
})
