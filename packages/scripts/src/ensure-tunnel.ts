#!/usr/bin/env bun

import { cmd } from './cmd'

export function ensureEnv() {
  // make it a module
}

await cmd`check if SST production tunnel is active`.run(async () => {
  const { spawnSync } = await import('node:child_process')

  const netstat = spawnSync('netstat', ['-rn'], { encoding: 'utf-8' }).stdout || ''
  const isTunnelActive = netstat.includes(`10.0.8/22`)

  if (!isTunnelActive) {
    console.error(`No tunnel active, run bun sst:tunnel:production first`)
    process.exit(1)
  }
})
