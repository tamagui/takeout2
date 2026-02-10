/**
 * Utility for running scripts in parallel with color-coded output
 */

import { spawn, type ChildProcess } from 'node:child_process'
import { cpus } from 'node:os'

const colors = [
  '\x1b[36m', // Cyan
  '\x1b[35m', // Magenta
  '\x1b[33m', // Yellow
  '\x1b[32m', // Green
  '\x1b[34m', // Blue
  '\x1b[31m', // Red
  '\x1b[90m', // Gray
]

const reset = '\x1b[0m'

// filter out bun shell's verbose error output
function isBunShellNoise(line: string): boolean {
  // eslint-disable-next-line no-control-regex
  const stripped = line.replace(/\x1b\[[0-9;]*m/g, '').trim()
  return (
    stripped.startsWith('ShellError:') ||
    stripped.startsWith('exitCode:') ||
    stripped.startsWith('stdout:') ||
    stripped.startsWith('stderr:') ||
    stripped.startsWith('at ShellPromise') ||
    stripped.startsWith('at BunShell') ||
    stripped.startsWith('Bun v') ||
    /^\d+\s*\|/.test(stripped) || // source code lines like "24 |     await $`..."
    /^\s*\^$/.test(stripped) // caret pointer line
  )
}

interface ScriptToRun {
  name: string
  path: string
  args?: string[]
}

// track all spawned processes for cleanup
const spawnedProcesses: ChildProcess[] = []
let cleaning = false

function killAllProcessGroups(signal: NodeJS.Signals = 'SIGTERM') {
  for (const proc of spawnedProcesses) {
    if (proc.pid) {
      // negative pid kills the entire process group (detached: true makes them group leaders)
      try {
        process.kill(-proc.pid, signal)
      } catch (_) {
        try {
          process.kill(proc.pid, signal)
        } catch (_) {}
      }
    }
  }
}

function cleanupAndExit() {
  if (cleaning) return
  cleaning = true

  process.stdout.write('\n\x1b[0m')
  killAllProcessGroups('SIGTERM')

  setTimeout(() => {
    killAllProcessGroups('SIGKILL')
    process.exit(0)
  }, 150)
}

process.on('SIGINT', cleanupAndExit)
process.on('SIGTERM', cleanupAndExit)

export async function runScriptsInParallel(
  scripts: ScriptToRun[],
  options: {
    title?: string
    onError?: 'continue' | 'exit'
    maxParallelism?: number
  } = {}
): Promise<void> {
  const { title, onError = 'exit', maxParallelism = cpus().length } = options

  if (title) {
    console.info()
    console.info(title)
    console.info()
  }

  const allPromises: Promise<void>[] = []
  const executing: Set<Promise<void>> = new Set()

  for (let i = 0; i < scripts.length; i++) {
    const script = scripts[i]!
    const scriptPromise = runSingleScript(script, i).finally(() => {
      executing.delete(scriptPromise)
    })

    allPromises.push(scriptPromise)
    executing.add(scriptPromise)

    if (executing.size >= maxParallelism) {
      await Promise.race(executing)
    }
  }

  const settledResults = await Promise.allSettled(allPromises)

  // Check for failures
  const failures = settledResults.filter((r) => r.status === 'rejected')

  if (failures.length > 0) {
    console.error(`\n${reset}\x1b[31m✗ ${failures.length} script(s) failed${reset}\n`)
    if (onError === 'exit') {
      process.exit(1)
    }
  } else {
    console.info(`\n${reset}\x1b[32m✓ All scripts completed successfully${reset}\n`)
  }
}

function runSingleScript(script: ScriptToRun, colorIndex: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const color = colors[colorIndex % colors.length]
    const prefixLabel = script.name

    const proc = spawn('bun', [script.path, ...(script.args || [])], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: false,
      env: { ...process.env, FORCE_COLOR: '3' } as any,
      detached: true,
    })

    spawnedProcesses.push(proc)

    let stderrBuffer = ''

    proc.stdout.on('data', (data) => {
      if (cleaning) return
      const lines = data.toString().split('\n')
      for (const line of lines) {
        if (line) console.info(`${color}${prefixLabel}${reset} ${line}`)
      }
    })

    proc.stderr.on('data', (data) => {
      const dataStr = data.toString()
      stderrBuffer += dataStr

      if (cleaning) return
      const lines = dataStr.split('\n')
      for (const line of lines) {
        if (line && !isBunShellNoise(line)) {
          console.error(`${color}${prefixLabel}${reset} ${line}`)
        }
      }
    })

    proc.on('error', (error) => {
      console.error(`${color}${prefixLabel}${reset} Failed to start: ${error.message}`)
      reject(error)
    })

    proc.on('close', (code) => {
      if (cleaning) return

      if (code && code !== 0) {
        // detect if this was a bun shell error (already printed inline)
        // check for ShellError or the bun shell stack trace pattern
        const isBunShellError =
          stderrBuffer.includes('ShellError') || stderrBuffer.includes('at BunShell')

        if (!isBunShellError) {
          console.error(`${color}${prefixLabel}${reset} Process exited with code ${code}`)

          if (stderrBuffer.trim()) {
            console.error(`\n${color}${prefixLabel}${reset} Error output:`)
            console.error('\x1b[90m' + '─'.repeat(80) + '\x1b[0m')
            console.error(stderrBuffer)
            console.error('\x1b[90m' + '─'.repeat(80) + '\x1b[0m\n')
          }
        }

        reject(new Error(`Script ${prefixLabel} failed with code ${code}`))
      } else {
        console.info(`${color}${prefixLabel}${reset} \x1b[32m✓ completed${reset}`)
        resolve()
      }
    })
  })
}
