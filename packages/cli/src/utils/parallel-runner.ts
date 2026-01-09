/**
 * Utility for running scripts in parallel with color-coded output
 */

import { spawn } from 'node:child_process'
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

interface ScriptToRun {
  name: string
  path: string
  args?: string[]
}

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

    let stderrBuffer = ''

    proc.stdout.on('data', (data) => {
      const lines = data.toString().split('\n')
      for (const line of lines) {
        if (line) console.info(`${color}${prefixLabel}${reset} ${line}`)
      }
    })

    proc.stderr.on('data', (data) => {
      const dataStr = data.toString()
      stderrBuffer += dataStr

      const lines = dataStr.split('\n')
      for (const line of lines) {
        if (line) console.error(`${color}${prefixLabel}${reset} ${line}`)
      }
    })

    proc.on('error', (error) => {
      console.error(`${color}${prefixLabel}${reset} Failed to start: ${error.message}`)
      reject(error)
    })

    proc.on('close', (code) => {
      if (code && code !== 0) {
        console.error(`${color}${prefixLabel}${reset} Process exited with code ${code}`)

        // Show error details
        if (stderrBuffer.trim()) {
          console.error(`\n${color}${prefixLabel}${reset} Error output:`)
          console.error('\x1b[90m' + '─'.repeat(80) + '\x1b[0m')
          console.error(stderrBuffer)
          console.error('\x1b[90m' + '─'.repeat(80) + '\x1b[0m\n')
        }

        reject(new Error(`Script ${prefixLabel} failed with code ${code}`))
      } else {
        console.info(`${color}${prefixLabel}${reset} \x1b[32m✓ completed${reset}`)
        resolve()
      }
    })
  })
}
