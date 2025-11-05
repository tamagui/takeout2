#!/usr/bin/env bun

/**
 * @description Start frontend in development mode for CI
 */

import { $ } from 'bun'
import { getTestEnv } from '@vxrn/scripts/helpers/get-test-env'

const testEnv = await getTestEnv()

// Set environment for test
process.env = {
  ...process.env,
  ...testEnv,
  NODE_ENV: 'development',
}

console.info('Starting frontend in development mode for CI...')

// Start the dev server
await $`one dev --port 8081`
