#!/usr/bin/env bun

// @description Clear all project ports

import { cmd } from '@take-out/cli'

await cmd`Clear all project ports`.run(async ({ $ }) => {
  const { ports } = await import('~/env')

  async function killPort(port: number) {
    try {
      // sigterm first for graceful shutdown
      await $`lsof -ti :${port} | xargs kill -15`.quiet()
    } catch {
      return
    }
    // wait for graceful shutdown, then force kill stragglers
    await Bun.sleep(500)
    try {
      await $`lsof -ti :${port} | xargs kill -9`.quiet()
    } catch {}
  }

  await Promise.all([
    killPort(ports.web), // web server
    killPort(ports.postgres), // postgres
    killPort(ports.zero), // zero
    killPort(ports.minio), // minio
    killPort(ports.minio + 1), // minio console
  ])
})
