#!/usr/bin/env bun

/**
 * @description Deploy hot update for iOS
 * @args --production
 */

import { spawn } from 'node:child_process'
import { parseArgs } from 'node:util'

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    production: {
      type: 'boolean',
      short: 'p',
    },
  },
})

async function main() {
  console.info('Deploying iOS hot update...')

  const args = ['hot-updater', 'deploy', '--platform', 'ios']
  if (values.production) {
    args.push('--production')
  }

  const child = spawn('bunx', args, {
    stdio: 'inherit',
    cwd: process.cwd(),
  })

  child.on('exit', (code) => {
    process.exit(code || 0)
  })
}

main().catch(console.error)
