#!/usr/bin/env bun

/**
 * @description Generate Drizzle schema types
 */

import { spawn } from 'node:child_process'

async function main() {
  console.info('Generating Drizzle schema types...')

  const child = spawn('bunx', ['drizzle-kit', 'generate'], {
    stdio: 'inherit',
    cwd: process.cwd(),
  })

  child.on('exit', (code) => {
    process.exit(code || 0)
  })
}

main().catch(console.error)
