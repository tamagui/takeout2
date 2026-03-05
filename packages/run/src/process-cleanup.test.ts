import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, test } from 'vitest'

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

async function waitForCondition(
  fn: () => boolean,
  timeoutMs = 5000,
  intervalMs = 50
): Promise<boolean> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (fn()) return true
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  return false
}

async function waitForFile(path: string, timeoutMs = 5000): Promise<string> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (existsSync(path)) {
      const content = readFileSync(path, 'utf-8').trim()
      if (content) return content
    }
    await new Promise((r) => setTimeout(r, 50))
  }
  throw new Error(`file never appeared: ${path}`)
}

const tmpDir = mkdtempSync(join(tmpdir(), 'proc-cleanup-'))
const pidsToCleanup: number[] = []

afterEach(async () => {
  for (const pid of pidsToCleanup) {
    try {
      process.kill(pid, 'SIGKILL')
    } catch {}
    try {
      process.kill(-pid, 'SIGKILL')
    } catch {}
  }
  pidsToCleanup.length = 0
})

function makeChildScript(pidFile: string, opts?: { grandchild?: boolean }): string {
  const path = join(
    tmpDir,
    `child-${Date.now()}-${Math.random().toString(36).slice(2)}.sh`
  )
  if (opts?.grandchild) {
    const gcPidFile = pidFile.replace('.pid', '-gc.pid')
    // use a separate script for grandchild to avoid escaping issues
    const gcScript = join(
      tmpDir,
      `gc-${Date.now()}-${Math.random().toString(36).slice(2)}.sh`
    )
    writeFileSync(gcScript, `#!/bin/bash\necho $$ > ${gcPidFile}\nsleep 999\n`, {
      mode: 0o755,
    })
    writeFileSync(
      path,
      `#!/bin/bash\necho $$ > ${pidFile}\nbash ${gcScript} &\nsleep 999\n`,
      {
        mode: 0o755,
      }
    )
  } else {
    writeFileSync(path, `#!/bin/bash\necho $$ > ${pidFile}\nsleep 999\n`, { mode: 0o755 })
  }
  return path
}

const handleProcessExitPath = join(__dirname, 'helpers', 'handleProcessExit.ts')

// creates a parent node script that uses real handleProcessExit
function createParentScript(opts: {
  childScripts: string[]
  parentPidFile: string
}): string {
  const scriptPath = join(
    tmpDir,
    `parent-${Date.now()}-${Math.random().toString(36).slice(2)}.ts`
  )
  writeFileSync(
    scriptPath,
    `
import { handleProcessExit } from '${handleProcessExitPath}'
import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'

const { addChildProcess } = handleProcessExit()

writeFileSync(${JSON.stringify(opts.parentPidFile)}, String(process.pid))

const scripts = ${JSON.stringify(opts.childScripts)}
for (const script of scripts) {
  const child = spawn('bash', [script], { detached: true, stdio: 'ignore' })
  child.unref()
  addChildProcess(child)
}

setInterval(() => {}, 60000)
`
  )
  return scriptPath
}

function spawnParent(scriptPath: string) {
  const child = spawn('bun', [scriptPath], {
    detached: true,
    stdio: 'ignore',
  })
  child.unref()
  pidsToCleanup.push(child.pid!)
  return child
}

describe('process cleanup', { timeout: 15_000 }, () => {
  test('SIGTERM kills all children', async () => {
    const pidFiles = [join(tmpDir, 'a1.pid'), join(tmpDir, 'a2.pid')]
    const parentPidFile = join(tmpDir, 'p-term.pid')
    const childScripts = pidFiles.map((f) => makeChildScript(f))
    const script = createParentScript({ childScripts, parentPidFile })

    spawnParent(script)

    const parentPid = parseInt(await waitForFile(parentPidFile))
    pidsToCleanup.push(parentPid)
    const childPids = await Promise.all(pidFiles.map((f) => waitForFile(f).then(Number)))
    childPids.forEach((p) => pidsToCleanup.push(p))

    expect(isAlive(parentPid)).toBe(true)
    childPids.forEach((pid) => expect(isAlive(pid)).toBe(true))

    process.kill(parentPid, 'SIGTERM')

    const allDead = await waitForCondition(
      () => !isAlive(parentPid) && childPids.every((p) => !isAlive(p)),
      5000
    )
    expect(allDead).toBe(true)
  })

  test('SIGINT kills all children', async () => {
    const pidFiles = [join(tmpDir, 'b1.pid')]
    const parentPidFile = join(tmpDir, 'p-int.pid')
    const childScripts = pidFiles.map((f) => makeChildScript(f))
    const script = createParentScript({ childScripts, parentPidFile })

    spawnParent(script)

    const parentPid = parseInt(await waitForFile(parentPidFile))
    pidsToCleanup.push(parentPid)
    const childPid = parseInt(await waitForFile(pidFiles[0]!))
    pidsToCleanup.push(childPid)

    process.kill(parentPid, 'SIGINT')

    const allDead = await waitForCondition(
      () => !isAlive(parentPid) && !isAlive(childPid),
      5000
    )
    expect(allDead).toBe(true)
  })

  test('SIGHUP kills all children', async () => {
    const pidFiles = [join(tmpDir, 'c1.pid')]
    const parentPidFile = join(tmpDir, 'p-hup.pid')
    const childScripts = pidFiles.map((f) => makeChildScript(f))
    const script = createParentScript({ childScripts, parentPidFile })

    spawnParent(script)

    const parentPid = parseInt(await waitForFile(parentPidFile))
    pidsToCleanup.push(parentPid)
    const childPid = parseInt(await waitForFile(pidFiles[0]!))
    pidsToCleanup.push(childPid)

    process.kill(parentPid, 'SIGHUP')

    const allDead = await waitForCondition(
      () => !isAlive(parentPid) && !isAlive(childPid),
      5000
    )
    expect(allDead).toBe(true)
  })

  test('process group kill reaches grandchildren', async () => {
    const pidFiles = [join(tmpDir, 'd1.pid')]
    const parentPidFile = join(tmpDir, 'p-gc.pid')
    const grandchildPidFile = join(tmpDir, 'd1-gc.pid')
    const childScripts = pidFiles.map((f) => makeChildScript(f, { grandchild: true }))
    const script = createParentScript({ childScripts, parentPidFile })

    spawnParent(script)

    const parentPid = parseInt(await waitForFile(parentPidFile))
    pidsToCleanup.push(parentPid)
    const childPid = parseInt(await waitForFile(pidFiles[0]!))
    pidsToCleanup.push(childPid)
    const gcPid = parseInt(await waitForFile(grandchildPidFile))
    pidsToCleanup.push(gcPid)

    expect(isAlive(childPid)).toBe(true)
    expect(isAlive(gcPid)).toBe(true)

    process.kill(parentPid, 'SIGTERM')

    const allDead = await waitForCondition(
      () => !isAlive(childPid) && !isAlive(gcPid),
      5000
    )
    expect(allDead).toBe(true)
  })

  test('pid file is created and cleaned up', async () => {
    const pidFiles = [join(tmpDir, 'e1.pid')]
    const parentPidFile = join(tmpDir, 'p-pidfile.pid')
    const childScripts = pidFiles.map((f) => makeChildScript(f))
    const script = createParentScript({ childScripts, parentPidFile })

    spawnParent(script)

    const parentPid = parseInt(await waitForFile(parentPidFile))
    pidsToCleanup.push(parentPid)
    const childPid = parseInt(await waitForFile(pidFiles[0]!))
    pidsToCleanup.push(childPid)

    // pid file should exist while parent is running
    const tkoFile = `/tmp/tko-run-${parentPid}.pids`
    const pidFileExists = await waitForCondition(() => existsSync(tkoFile), 3000)
    expect(pidFileExists).toBe(true)

    const contents = readFileSync(tkoFile, 'utf-8').trim()
    expect(contents).toContain(String(childPid))

    // send SIGTERM and verify pid file is cleaned up
    process.kill(parentPid, 'SIGTERM')

    const cleaned = await waitForCondition(() => !existsSync(tkoFile), 5000)
    expect(cleaned).toBe(true)
  })
})
