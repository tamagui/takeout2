#!/usr/bin/env bun

/**
 * @description View logs from production deployment
 */

import { exec } from './helpers/exec'

const args = process.argv.slice(2)
const services: string[] = []
let follow = false
let machine: string | null = null

for (let i = 0; i < args.length; i++) {
  const arg = args[i]
  if (!arg) continue
  if (arg === '-f' || arg === '--follow') {
    follow = true
  } else if (arg === '-m' || arg === '--machine') {
    const nextArg = args[++i]
    if (nextArg) machine = nextArg
  } else if (!arg.startsWith('-')) {
    services.push(arg)
  }
}

const serviceStr = services.join(' ')
const followFlag = follow ? ' -f' : ''
const machineFlag = machine ? ` -m ${machine}` : ''

const target = services.length > 0 ? services.join(', ') : 'all services'
console.info(
  `📜 viewing logs for ${target}${follow ? ' (following)' : ''}${machine ? ` on ${machine}` : ''}...\n`
)

try {
  exec(`uc logs${serviceStr ? ` ${serviceStr}` : ''}${followFlag}${machineFlag}`)
} catch (error) {
  console.error('\n💥 failed to get logs')
  console.error('\nusage: bun tko uncloud logs [services...] [-f] [-m machine]')
  console.error('\nexamples:')
  console.error('  bun tko uncloud logs              # all services')
  console.error('  bun tko uncloud logs web          # single service')
  console.error('  bun tko uncloud logs web api -f   # multiple services, follow')
  console.error('  bun tko uncloud logs -m machine1  # specific machine')
  process.exit(1)
}
