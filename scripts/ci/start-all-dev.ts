#!/usr/bin/env bun

/**
 * @description Start backend and frontend in dev mode for quick integration testing
 */

import { getTestEnv } from '@take-out/scripts/helpers/get-test-env'
import { handleProcessExit } from '@take-out/scripts/helpers/handleProcessExit'
import { run } from '@take-out/scripts/helpers/run'
import { waitForPort } from '@take-out/scripts/helpers/wait-for-port'

handleProcessExit()

const testEnv = await getTestEnv()

// Start backend in background
void run(`bun ./scripts/ci/start-backend.ts`, {
  detached: true,
  env: testEnv,
})

// Wait for postgres and zero to be ready
console.info('Waiting for backend services...')
await waitForPort(5432) // postgres
await waitForPort(4848) // zero

// Start frontend in dev mode
await run(`bun ./scripts/ci/start-frontend-dev.ts`, {
  env: testEnv,
})
