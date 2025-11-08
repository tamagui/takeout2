#!/usr/bin/env bun

/**
 * @description Start backend services for CI
 */

import { run } from '@vxrn/scripts/helpers/run'
import { getTestWebEnv } from './helpers/getTestEnv'

await run(`bun backend:clean`)
await run(`bun backend --no-color`, {
  env: await getTestWebEnv(),
})
