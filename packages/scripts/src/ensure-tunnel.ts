#!/usr/bin/env bun

import { spawnSync } from 'node:child_process'

const netstat = spawnSync('netstat', ['-rn'], { encoding: 'utf-8' }).stdout || ''
const isTunnelActive = netstat.includes(`10.0.8/22`)

if (!isTunnelActive) {
  console.error(`No tunnel active, run bun sst:tunnel:production first`)
  process.exit(1)
}

export function ensureEnv() {
  // make it a module
}
