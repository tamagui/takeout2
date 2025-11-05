#!/usr/bin/env bun

/**
 * @description Start backend services for CI
 */

import { $ } from 'bun'
import { getTestEnv } from '@vxrn/scripts/helpers/get-test-env'

const testEnv = await getTestEnv()

// Set environment for test
process.env = {
  ...process.env,
  ...testEnv,
}

console.info('Starting backend services for CI...')

// Start docker compose with test configuration
await $`docker compose up --build --remove-orphans`
