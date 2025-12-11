#!/usr/bin/env bun

/**
 * @description Ensure a port is available, exit with error if in use
 */

import { execSync } from 'node:child_process'

const port = process.argv[2]

if (!port) {
  console.error('usage: bun tko ensure-port <port>')
  process.exit(1)
}

const portNum = Number.parseInt(port, 10)

if (Number.isNaN(portNum) || portNum < 1 || portNum > 65535) {
  console.error(`invalid port: ${port}`)
  process.exit(1)
}

function getPortProcess(p: number): { pid?: number; command?: string } {
  try {
    const output = execSync(`lsof -i :${p} -t`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim()

    if (!output) return {}

    const pid = Number.parseInt(output.split('\n')[0] || '', 10)
    if (Number.isNaN(pid)) return {}

    // get command name
    const ps = execSync(`ps -p ${pid} -o comm=`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim()

    return { pid, command: ps }
  } catch {
    return {}
  }
}

const { pid, command } = getPortProcess(portNum)

if (pid) {
  console.error(`port ${portNum} in use by ${command || 'unknown'} (pid ${pid})`)
  console.error(`run: kill ${pid}`)
  process.exit(1)
}
