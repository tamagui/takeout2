#!/usr/bin/env bun

import { $ } from 'bun'

const killedPids = new Set<string>()

async function killTree(pid: string, label: string) {
  if (killedPids.has(pid)) return
  killedPids.add(pid)

  // find children first so we can kill bottom-up
  try {
    const result = await $`ps -eo pid,ppid`.quiet()
    const lines = result.stdout.toString().trim().split('\n').slice(1)
    for (const line of lines) {
      const [childPid, parentPid] = line.trim().split(/\s+/)
      if (parentPid === pid) {
        await killTree(childPid, label)
      }
    }
  } catch {}

  try {
    await $`kill -9 ${pid}`.quiet()
  } catch {}
}

// find and kill process groups matching a pattern in this project
async function cleanupPattern(pattern: string) {
  try {
    const result = await $`ps -eo pid,pgid,command`.quiet()
    const lines = result.stdout.toString().trim().split('\n').slice(1)

    const pgids = new Set<string>()

    for (const line of lines) {
      const parts = line.trim().split(/\s+/)
      const pgid = parts[1]
      const command = parts.slice(2).join(' ')

      if (!command.includes(pattern)) continue
      if (!command.includes('takeout')) continue
      pgids.add(pgid)
    }

    for (const pgid of pgids) {
      // try process group kill first (works on both linux and mac)
      try {
        process.kill(-Number(pgid), 9)
        console.info(`  killed group ${pgid} (${pattern})`)
      } catch {
        // fallback: kill the tree manually
        await killTree(pgid, pattern)
      }
    }
  } catch {}
}

// kill everything on a port by process group
async function cleanupPort(port: number) {
  try {
    const result = await $`lsof -i :${port} -P -n`.quiet()
    const lines = result.stdout.toString().trim().split('\n').slice(1)

    const pids = new Set<string>()
    for (const line of lines) {
      const pid = line.trim().split(/\s+/)[1]
      if (pid) pids.add(pid)
    }

    for (const pid of pids) {
      await killTree(pid, `port ${port}`)
    }
  } catch {}
}

await cleanupPort(8081)
await cleanupPattern('Onejs:dev')
await cleanupPattern('Onejs:serve')
await cleanupPattern('ops run-frontend')
await cleanupPattern('ops run-backend')

console.info('cleanup done')
