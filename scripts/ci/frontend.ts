#!/usr/bin/env bun

/**
 * @description Start frontend in production mode for CI
 */

import { run } from '@tamatko/scripts/helpers/run'
import { getTestWebEnv } from './helpers/getTestEnv'

await run(`bun run web serve`, {
  prefix: 'web-serve',
  env: await getTestWebEnv(),
})
