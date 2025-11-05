#!/usr/bin/env bun

/**
 * @description Run database migrations
 * @args --dry-run
 */

import { spawn } from 'node:child_process'
import { parseArgs } from 'node:util'

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    'dry-run': {
      type: 'boolean',
    },
  },
})

async function main() {
  console.info('Running database migrations...')

  const args = ['better-auth/cli', 'migrate']
  if (values['dry-run']) {
    console.info('Dry run mode - no changes will be made')
    args.push('--dry-run')
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
