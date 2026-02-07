#!/usr/bin/env bun

import { cmd } from './cmd'

await cmd`ensure a port is available, exit with error if in use`
  .args('--auto-kill string')
  .run(async ({ args }) => {
    const { execSync } = await import('node:child_process')

    const port = args.rest[0]

    if (!port) {
      console.error('usage: bun tko ensure-port <port> [--auto-kill <prefix>]')
      process.exit(1)
    }

    const portNum = Number.parseInt(port, 10)

    if (Number.isNaN(portNum) || portNum < 1 || portNum > 65535) {
      console.error(`invalid port: ${port}`)
      process.exit(1)
    }

    function getListeningProcess(p: number): { pid?: number; command?: string } {
      try {
        // use -sTCP:LISTEN to only find processes LISTENING on the port (servers)
        const output = execSync(`lsof -i :${p} -sTCP:LISTEN -t`, {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'ignore'],
        }).trim()

        if (!output) return {}

        const pid = Number.parseInt(output.split('\n')[0] || '', 10)
        if (Number.isNaN(pid)) return {}

        const ps = execSync(`ps -p ${pid} -o comm=`, {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'ignore'],
        }).trim()

        return { pid, command: ps }
      } catch {
        return {}
      }
    }

    function killProcess(pid: number): boolean {
      try {
        execSync(`kill ${pid}`, { stdio: 'ignore' })
        return true
      } catch {
        return false
      }
    }

    const { pid, command } = getListeningProcess(portNum)

    if (pid) {
      if (args.autoKill && command?.startsWith(args.autoKill)) {
        console.info(`killing ${command} (pid ${pid}) on port ${portNum}`)
        if (killProcess(pid)) {
          Bun.sleepSync(100)
          const check = getListeningProcess(portNum)
          if (!check.pid) {
            process.exit(0)
          }
          console.error(`failed to free port ${portNum}`)
          process.exit(1)
        }
        console.error(`failed to kill pid ${pid}`)
        process.exit(1)
      }

      console.error(`port ${portNum} in use by ${command || 'unknown'} (pid ${pid})`)
      console.error(`run: kill ${pid}`)
      process.exit(1)
    }
  })
