#!/usr/bin/env bun

/**
 * @description Start backend services for CI
 */

import { run } from '@take-out/scripts/helpers/run'
import { getTestEnv } from '@take-out/scripts/helpers/get-test-env'

await run(`bun backend:clean`)
await run(`bun backend --no-color`, {
  env: await getTestEnv(),
})
