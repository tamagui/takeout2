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
await waitForPort(+(process.env.VITE_PORT_POSTGRES || 5433))
await waitForPort(+(process.env.VITE_PORT_ZERO || 4848))

// Start frontend in dev mode
await run(`bun ./scripts/ci/start-frontend-dev.ts`, {
  env: testEnv,
})
