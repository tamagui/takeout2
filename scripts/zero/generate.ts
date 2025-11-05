#!/usr/bin/env bun

/**
 * @description Generate Zero sync code
 */

import { spawn } from 'node:child_process'

async function main() {
  console.info('Generating Zero sync code...')

  const child = spawn('bun', ['over-zero', 'generate'], {
    stdio: 'inherit',
    cwd: process.cwd(),
  })

  child.on('exit', (code) => {
    process.exit(code || 0)
  })
}

main().catch(console.error)
