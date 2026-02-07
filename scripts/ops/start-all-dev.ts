#!/usr/bin/env bun
import { cmd } from '@take-out/cli'

await cmd`Start backend and frontend in dev mode for quick integration testing`.run(
  async ({ run }) => {
    const { getTestEnv } = await import('@take-out/scripts/helpers/get-test-env')
    const { handleProcessExit } = await import(
      '@take-out/scripts/helpers/handleProcessExit'
    )
    const { waitForPort } = await import('@take-out/scripts/helpers/wait-for-port')

    handleProcessExit()

    const testEnv = await getTestEnv()

    // start backend in background
    void run(`bun ./scripts/ops/run-backend.ts`, {
      detached: true,
      env: testEnv,
    })

    // wait for postgres and zero to be ready
    console.info('Waiting for backend services...')
    await waitForPort(+(process.env.VITE_PORT_POSTGRES || 5433))
    await waitForPort(+(process.env.VITE_PORT_ZERO || 4848))

    // start frontend in dev mode
    await run(`bun ./scripts/ops/run-frontend-dev.ts`, {
      env: testEnv,
    })
  }
)
