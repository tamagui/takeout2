/**
 * Utility for running scripts in parallel with color-coded output
 */

import { spawn } from 'node:child_process'

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
  } = {}
): Promise<void> {
  const { title, onError = 'exit' } = options

  if (title) {
    console.info()
    console.info(title)
    console.info()
  }

  const scriptPromises = scripts.map((script, index) => {
    return runSingleScript(script, index)
  })

  const results = await Promise.allSettled(scriptPromises)

  // Check for failures
  const failures = results.filter((r) => r.status === 'rejected')

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
