#!/usr/bin/env bun

/**
 * @description Clean up local Multipass VM
 */

import { execSync } from 'node:child_process'

const VM_NAME = 'takeout-deploy'

try {
  console.info('cleaning up multipass vm...\n')
  execSync(`multipass delete ${VM_NAME}`, { stdio: 'inherit' })
  execSync('multipass purge', { stdio: 'inherit' })
  console.info('\n✅ vm cleaned up')
} catch (error) {
  console.error('failed to clean up vm')
  process.exit(1)
}
