#!/usr/bin/env bun

/**
 * deploy to local multipass vm (shorthand for deploy.ts --local)
 */

import { spawn } from 'node:child_process'
import { resolve } from 'node:path'

const deployScript = resolve(import.meta.dir, 'deploy.ts')

const child = spawn('bun', [deployScript, '--local'], {
  cwd: process.cwd(),
  stdio: 'inherit',
})

child.on('exit', (code) => {
  process.exit(code || 0)
})
