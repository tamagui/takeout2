#!/usr/bin/env bun

const netstat = Bun.spawnSync(`netstat -rn`.split(' ')).stdout
const isTunnelActive = netstat.includes(`10.0.8/22`)

if (!isTunnelActive) {
  console.error(`No tunnel active, run bun sst:tunnel:production first`)
  process.exit(1)
}

export function ensureEnv() {
  // make it a module
}
