import { afterEach, describe, expect, test } from 'bun:test'
import { spawn, type ChildProcess } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const RUNNER = resolve(import.meta.dir, 'run-pty.mjs')
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
  throw new Error('timed out waiting for supervised pty state')
}

function createFixture(childSource = 'await new Promise(() => {})') {
  const directory = mkdtempSync(join(tmpdir(), 'tko-run-pty-supervision-'))
  directories.push(directory)
  const startsPath = join(directory, 'starts.txt')
  writeFileSync(
    join(directory, 'child.ts'),
    `import { appendFileSync } from 'node:fs'\nappendFileSync(process.env.STARTS_PATH!, String(process.pid) + '\\n')\n${childSource}\n`,
  )
  writeFileSync(
    join(directory, 'package.json'),
    JSON.stringify({ scripts: { child: 'bun child.ts' } }),
  )

  return {
    directory,
    starts() {
      if (!existsSync(startsPath)) return []
      return readFileSync(startsPath, 'utf8').trim().split('\n').filter(Boolean)
    },
  }
}

function startRunner(childSource = 'await new Promise(() => {})') {
  const fixture = createFixture(childSource)

  const child = spawn('node', [RUNNER, '--watch', 'child'], {
    cwd: fixture.directory,
    env: { ...process.env, STARTS_PATH: join(fixture.directory, 'starts.txt') },
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

  return {
    child,
    output: () => output,
    starts: fixture.starts,
  }
}

describe('pty run process supervision', () => {
  test('watch restarts a child terminated by a signal', async () => {
    const runner = startRunner()
    await waitFor(() => runner.starts().length === 1)

    process.kill(Number(runner.starts()[0]), 'SIGTERM')

    await waitFor(() => runner.starts().length === 2).catch((error: unknown) => {
      throw new Error(`${String(error)}\n${runner.output()}`)
    })
    expect(runner.starts()[1]).not.toBe(runner.starts()[0])
  }, 15_000)

  test('watch leaves a cleanly exited slot stopped', async () => {
    const runner = startRunner('process.exit(0)')
    await waitFor(() => runner.starts().length === 1)

    await Bun.sleep(1_500)
    expect(runner.starts()).toHaveLength(1)
  }, 15_000)

  test('handles SIGTERM without passing the signal name to process.exit', async () => {
    const runner = startRunner()
    await waitFor(() => runner.starts().length === 1)

    runner.child.kill('SIGTERM')
    const exitCode = await new Promise<number | null>((done) => {
      runner.child.once('exit', (code) => done(code))
    })

    expect(exitCode).toBe(0)
    expect(runner.output()).not.toContain('ERR_INVALID_ARG_TYPE')
  }, 15_000)
})
