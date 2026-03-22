import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterAll, afterEach, describe, expect, it } from 'vitest'

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

async function waitForDead(pid: number, timeoutMs = 3000): Promise<boolean> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (!isAlive(pid)) return true
    await new Promise((r) => setTimeout(r, 50))
  }
  return false
}

async function waitForFile(path: string, timeoutMs = 3000): Promise<boolean> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (existsSync(path)) return true
    await new Promise((r) => setTimeout(r, 50))
  }
  return false
}

describe('process cleanup', () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'tko-test-'))
  const pids: number[] = []

  afterEach(() => {
    for (const pid of pids) {
      try {
        process.kill(-pid, 'SIGKILL')
      } catch {}
      try {
        process.kill(pid, 'SIGKILL')
      } catch {}
    }
    pids.length = 0
  })

  afterAll(() => {
    try {
      rmSync(tmpDir, { recursive: true, force: true })
    } catch {}
  })

  it('detached child gets its own process group', async () => {
    const pidFile = join(tmpDir, 'child1.pid')
    const child = spawn('bash', ['-c', `echo $$ > ${pidFile}; sleep 999`], {
      detached: true,
      stdio: 'ignore',
    })
    pids.push(child.pid!)
    child.unref()

    expect(await waitForFile(pidFile)).toBe(true)
    const childPid = parseInt(readFileSync(pidFile, 'utf-8').trim(), 10)

    expect(isAlive(childPid)).toBe(true)

    // killing the process group should kill it
    try {
      process.kill(-child.pid!, 'SIGKILL')
    } catch {}
    expect(await waitForDead(childPid)).toBe(true)
  })

  it('process group kill reaches grandchildren', async () => {
    const grandchildPidFile = join(tmpDir, 'grandchild.pid')
    // write a helper script so escaping is clean
    const helperScript = join(tmpDir, 'grandchild-helper.sh')
    writeFileSync(
      helperScript,
      `#!/bin/bash\necho $$ > ${grandchildPidFile}\nsleep 999\n`,
      { mode: 0o755 },
    )

    const parent = spawn('bash', ['-c', `bash ${helperScript} & wait`], {
      detached: true,
      stdio: 'ignore',
    })
    pids.push(parent.pid!)

    expect(await waitForFile(grandchildPidFile)).toBe(true)
    const grandchildPid = parseInt(readFileSync(grandchildPidFile, 'utf-8').trim(), 10)
    pids.push(grandchildPid)

    expect(isAlive(grandchildPid)).toBe(true)

    // kill the process group — grandchild should die too
    try {
      process.kill(-parent.pid!, 'SIGKILL')
    } catch {}
    expect(await waitForDead(grandchildPid)).toBe(true)
  })

  it('SIGTERM on parent with trap kills children', async () => {
    const childPidFile = join(tmpDir, 'term-child.pid')
    const wrapperScript = join(tmpDir, 'wrapper.sh')
    writeFileSync(
      wrapperScript,
      [
        '#!/bin/bash',
        'cleanup() { kill 0; exit 0; }',
        'trap cleanup SIGTERM',
        `bash -c 'echo $$ > ${childPidFile}; sleep 999' &`,
        'wait',
        '',
      ].join('\n'),
      { mode: 0o755 },
    )

    const parent = spawn('bash', [wrapperScript], {
      detached: true,
      stdio: 'ignore',
    })
    pids.push(parent.pid!)

    expect(await waitForFile(childPidFile)).toBe(true)
    const childPid = parseInt(readFileSync(childPidFile, 'utf-8').trim(), 10)
    pids.push(childPid)

    expect(isAlive(childPid)).toBe(true)

    // send SIGTERM to the process group
    try {
      process.kill(-parent.pid!, 'SIGTERM')
    } catch {}
    expect(await waitForDead(childPid, 5000)).toBe(true)
  })
})
