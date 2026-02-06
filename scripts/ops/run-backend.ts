#!/usr/bin/env bun

/**
 * @description Start backend services for CI
 */

import { getTestEnv } from '@take-out/scripts/helpers/get-test-env'
import { run } from '@take-out/scripts/helpers/run'

await run(`bun backend:clean`)
await run(`bun backend --no-color`, {
  env: await getTestEnv(),
})
