#!/usr/bin/env bun

/**
 * @description Start frontend in production mode for CI
 */

import { run } from '@take-out/scripts/helpers/run'
import { getTestEnv } from '@take-out/scripts/helpers/get-test-env'

await run(`bun run web serve`, {
  prefix: 'web-serve',
  env: await getTestEnv(),
})
