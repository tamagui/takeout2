#!/usr/bin/env bun

/**
 * @description Get SST environment variables
 */

import { spawn } from 'node:child_process'

async function main() {
  const child = spawn('bun', ['takeout', 'script', 'run', 'sst-get-environment'], {
    stdio: 'inherit',
    cwd: process.cwd(),
  })

  child.on('exit', (code) => {
    process.exit(code || 0)
  })
}

main().catch(console.error)
