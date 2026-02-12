#!/usr/bin/env bun

// @description Clear all project ports

import { cmd } from '@take-out/cli'

await cmd`Clear all project ports`.run(async ({ $ }) => {
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
    killPort(8081), // web server
    killPort(5433), // postgres
    killPort(4848), // zero
    killPort(9200), // minio
    killPort(9201), // minio console
  ])
})
