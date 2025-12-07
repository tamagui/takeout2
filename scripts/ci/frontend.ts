#!/usr/bin/env bun

/**
 * @description Start frontend in production mode for CI
 */

import { getTestEnv } from '@take-out/scripts/helpers/get-test-env'
import { run } from '@take-out/scripts/helpers/run'

await run(`bun run web serve`, {
  prefix: 'web-serve',
  env: await getTestEnv(),
})
