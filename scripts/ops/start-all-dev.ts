#!/usr/bin/env bun

import { cmd } from '@o/cli'

await cmd`Start backend and frontend in dev mode for quick integration testing`.run(
  async ({ run }) => {
    const { ports } = await import('~/env')
    const { getTestEnv } = await import('@o/scripts/helpers/get-test-env')
    const { handleProcessExit } = await import('@o/run/helpers/handleProcessExit')
    const { waitForPort } = await import('@o/scripts/helpers/wait-for-port')

    handleProcessExit()

    const testEnv = await getTestEnv()

    // start backend in background
    void run(`bun ops run-backend`, {
      detached: true,
      env: testEnv,
    })

    // wait for postgres and zero to be ready
    console.info('Waiting for backend services...')
    await waitForPort(ports.postgres)
    await waitForPort(ports.zero)

    // start frontend in dev mode
    await run(`bun ops run-frontend --dev`, {
      env: testEnv,
    })
  },
)
