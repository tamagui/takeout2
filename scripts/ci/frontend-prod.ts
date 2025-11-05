#!/usr/bin/env bun

/**
 * @description Start frontend in production mode for CI
 */

import { $ } from 'bun'
import { getTestEnv } from '@vxrn/scripts/helpers/get-test-env'

const testEnv = await getTestEnv()

// Set environment for test
process.env = {
  ...process.env,
  ...testEnv,
  NODE_ENV: 'production',
}

console.info('Starting frontend in production mode for CI...')

// Serve the production build
await $`one serve --port 8081`
