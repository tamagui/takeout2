#!/usr/bin/env bun

/**
 * @description Clean build artifacts and temporary files
 */

import { execSync } from 'node:child_process'

try {
  execSync('rm -rf dist types .tamagui .vite node_modules/.cache', { stdio: 'inherit' })
  console.info('Cleanup complete!')
} catch (error) {
  console.error('Error cleaning up')
  throw error
}
