#!/usr/bin/env bun

import { sleep } from '@vxrn/helpers'

const ONE_SERVER_URL = process.env.ONE_SERVER_URL || 'http://localhost:8081'
const CHECK_INTERVAL = 2000

async function checkServer(): Promise<boolean> {
  try {
    await fetch(ONE_SERVER_URL, {
      signal: AbortSignal.timeout(5000),
    }).then((res) => res.text())
    // give it a couple seconds to build initial route
    await sleep(2000)
    return true
  } catch (error) {
    return false
  }
}

async function waitForServer(): Promise<void> {
  process.stdout.write(`Waiting for server at ${ONE_SERVER_URL}...\n`)

  while (true) {
    await new Promise((resolve) => setTimeout(resolve, CHECK_INTERVAL))
    const isReady = await checkServer()

    if (isReady) {
      process.stdout.write(`✓ Server at ${ONE_SERVER_URL} is ready!\n`)
      break
    }

    process.stdout.write(
      `Waiting to start dev watch until after dev server (wait ${CHECK_INTERVAL / 1000}s)...\n`
    )
  }
}

await waitForServer()
process.exit(0)
