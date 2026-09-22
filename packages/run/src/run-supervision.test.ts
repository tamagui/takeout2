import { afterEach, describe, expect, test } from 'bun:test'
import { spawn, type ChildProcess } from 'node:child_process'
import {
  appendFileSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const RUNNER = resolve(import.meta.dir, 'run.ts')
const running: ChildProcess[] = []
const directories: string[] = []

afterEach(async () => {
  for (const child of running.splice(0)) {
    if (child.exitCode !== null || child.signalCode !== null) continue
    child.kill('SIGTERM')
    await new Promise<void>((done) => child.once('exit', () => done()))
  }
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

async function waitFor(read: () => boolean, timeoutMs = 5_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (read()) return
    await Bun.sleep(25)
  }
  throw new Error('timed out waiting for supervised process state')
}

function startRunner(watch: boolean) {
  const directory = mkdtempSync(join(tmpdir(), 'tko-run-supervision-'))
  directories.push(directory)
  const startsPath = join(directory, 'starts.txt')
  writeFileSync(
    join(directory, 'child.ts'),
    `import { appendFileSync } from 'node:fs'\nappendFileSync(process.env.STARTS_PATH!, String(process.pid) + '\\n')\nawait new Promise(() => {})\n`,
  )
  writeFileSync(
    join(directory, 'package.json'),
    JSON.stringify({ scripts: { child: 'bun child.ts' } }),
  )

  const child = spawn('bun', [RUNNER, ...(watch ? ['--watch'] : []), 'child'], {
    cwd: directory,
    env: { ...process.env, STARTS_PATH: startsPath },
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  running.push(child)
  let output = ''
  child.stdout?.on('data', (chunk) => {
    output += String(chunk)
  })
  child.stderr?.on('data', (chunk) => {
    output += String(chunk)
  })
  const managedPidsPath = `/tmp/tko-run-${child.pid}.pids`

  return {
    child,
    managedPidsPath,
    startsPath,
    output() {
      return output
    },
    starts() {
      if (!existsSync(startsPath)) return []
      return readFileSync(startsPath, 'utf8').trim().split('\n').filter(Boolean)
    },
    managedPids() {
      if (!existsSync(managedPidsPath)) return []
      return readFileSync(managedPidsPath, 'utf8').trim().split('\n').filter(Boolean)
    },
  }
}

describe('run process supervision', () => {
  test('watch restarts a child terminated by a signal', async () => {
    const runner = startRunner(true)
    await waitFor(() => runner.starts().length === 1 && runner.managedPids().length === 1)

    process.kill(Number(runner.managedPids()[0]), 'SIGTERM')

    await waitFor(() => runner.starts().length === 2)
    expect(runner.starts()[1]).not.toBe(runner.starts()[0])
  }, 15_000)
})
