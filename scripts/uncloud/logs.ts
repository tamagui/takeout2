#!/usr/bin/env bun

/**
 * @description View logs from production deployment
 */

import { exec } from './helpers/exec'

const service = process.argv[2] || 'web'
const follow = process.argv.includes('-f') || process.argv.includes('--follow')

console.info(`📜 viewing logs for ${service}${follow ? ' (following)' : ''}...\n`)

try {
  exec(`uc logs ${service}${follow ? ' -f' : ''}`)
} catch (error) {
  console.error('\n💥 failed to get logs')
  console.error('\navailable services: web, zero, minio')
  console.error('usage: bun scripts/uncloud/logs.ts [service] [-f]')
  process.exit(1)
}
