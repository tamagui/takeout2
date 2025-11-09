import type { ChildProcess } from 'node:child_process'
import type { Timer } from '@tamatko/helpers'

export type ProcessType = ChildProcess | Bun.Subprocess
export type ProcessHandler = (process: ProcessType) => void

// track if we're in cleanup state (another process failed)
let isInExitCleanup = false

export function setExitCleanupState(state: boolean) {
  isInExitCleanup = state
}

export function getIsExiting() {
  return isInExitCleanup
}

const processHandlers = new Set<ProcessHandler>()

const colors = [
  '\x1b[36m', // cyan
  '\x1b[35m', // magenta
  '\x1b[32m', // green
  '\x1b[33m', // yellow
  '\x1b[34m', // blue
  '\x1b[31m', // red
]
const reset = '\x1b[0m'
let colorIndex = 0

function getNextColor(): string {
  const color = colors[colorIndex % colors.length]!
  colorIndex++
  return color
}

const running: Record<string, Promise<unknown> | undefined | null> = {}

export async function runInline(name: string, cb: () => Promise<void>) {
  const promise = cb()
  running[name] = promise
  return await promise
}

export async function run(
  command: string,
  options?: {
    env?: Record<string, string>
    cwd?: string
    silent?: boolean
    captureOutput?: boolean
    prefix?: string
    detached?: boolean
    timeout?: number
    timing?: boolean | string
  }
) {
  const { env, cwd, silent, captureOutput, prefix, detached, timeout, timing } =
    options || {}

  if (timing) {
    const name = typeof timing === 'string' ? timing : command
    const startTime = Date.now()
    try {
      const promise = runInternal()
      running[name] = promise
      const result = await promise
      const duration = Date.now() - startTime
      console.info(
        `\x1b[32m✓\x1b[0m \x1b[35m${name}\x1b[0m completed in \x1b[33m${formatDuration(duration)}\x1b[0m`
      )
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`✗ ${name} failed after ${formatDuration(duration)}`)
      throw error
    } finally {
      running[name] = null
    }
  }

  return runInternal()

  async function runInternal() {
    if (!silent) {
      console.info(`$ ${command}${cwd ? ` (in ${cwd})` : ``}`)
    }

    let timeoutId: Timer | undefined
    let didTimeOut = false

    try {
      const shell = Bun.spawn(['bash', '-c', command], {
        env: { ...process.env, ...(env || {}) },
        cwd,
        stdout: 'pipe',
        stderr: 'pipe', // always pipe stderr so we can capture it for error messages
      })

      if (detached) {
        shell.unref()
      }

      processHandlers.forEach((cb) => cb(shell))

      if (timeout) {
        timeoutId = setTimeout(() => {
          didTimeOut = true
          console.error(`Command timed out after ${timeout}ms: ${command}`)
          shell.kill()
        }, timeout)
      }

      const color = prefix ? getNextColor() : ''
      const coloredPrefix = prefix ? `${color}[${prefix}]${reset}` : ''

      const writeOutput = (text: string, isStderr: boolean) => {
        if (!silent) {
          const output = prefix ? `${coloredPrefix} ${text}` : text
          if (!prefix || !captureOutput) {
            const stream = isStderr ? process.stderr : process.stdout
            stream.write(output)
          }
        }
      }

      const processStream = async (
        stream: ReadableStream<Uint8Array> | undefined,
        isStderr: boolean
      ): Promise<string> => {
        if (silent && !captureOutput) {
          return ''
        }

        if (!stream) return ''

        let buffer = ''
        let captured = ''
        const decoder = new TextDecoder()
        const reader = stream.getReader()

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const text = buffer + decoder.decode(value, { stream: true })
            const lines = text.split('\n')

            // keep last partial line in buffer
            buffer = lines.pop() || ''

            // process complete lines
            for (const line of lines) {
              // always capture for potential error messages or captureOutput
              captured += line + '\n'

              // output if not silent and appropriate
              if (!captureOutput || prefix) {
                writeOutput(line + '\n', isStderr)
              }
            }
          }

          // output any remaining buffer
          if (buffer) {
            captured += buffer
            if (!captureOutput || prefix) {
              writeOutput(buffer + '\n', isStderr)
            }
          }
        } catch (err) {
          console.error(`Error reading stream!`, err)
        } finally {
          reader.releaseLock()
        }

        return captured
      }

      // always process both streams
      const [stdout, stderr] = await Promise.all([
        processStream(shell.stdout, false),
        processStream(shell.stderr, true),
      ])

      const exitCode = await shell.exited

      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      if (detached) {
        return { stdout: '', stderr: '' }
      }

      if (exitCode !== 0) {
        const errorMsg =
          exitCode === 143 && didTimeOut
            ? `Command timed out after ${timeout}ms: ${command}`
            : `Command failed with exit code ${exitCode}: ${command}`

        if (!silent && !isInExitCleanup) {
          console.error(`run() error: ${errorMsg}: ${stderr || ''}`)
        }

        const error = new Error(errorMsg, { cause: { exitCode } })
        Error.captureStackTrace(error, runInternal)
        throw error
      }

      return { stdout, stderr, exitCode }
    } catch (error) {
      clearTimeout(timeoutId)
      if (!silent && !isInExitCleanup) {
        // only show the error message, not the full object if it's our error
        if (error instanceof Error && (error as any).cause?.exitCode !== undefined) {
          // this is our controlled error, already logged above
        } else {
          console.error(`Error running command: ${command}`, error)
        }
      } else if (!silent && isInExitCleanup) {
        // simple message when being killed due to another error
        const shortCmd = command.split(' ')[0]
        console.error(`${shortCmd} exiting due to earlier error`)
      }
      throw error
    }
  }
}

export const addProcessHandler = (cb: ProcessHandler) => {
  processHandlers.add(cb)
}

export async function waitForRun(name: string) {
  if (running[name] === undefined) {
    throw new Error(`Can't wait before task runs: ${name}`)
  }
  await running[name]
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  }
  return `${seconds}s`
}

export async function printTiming<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const startTime = Date.now()
  try {
    const result = await fn()
    const duration = Date.now() - startTime
    console.info(
      `\x1b[32m✓\x1b[0m \x1b[35m${name}\x1b[0m completed in \x1b[33m${formatDuration(duration)}\x1b[0m`
    )
    return result
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`✗ ${name} failed after ${formatDuration(duration)}`)
    throw error
  }
}

export async function runParallel(
  tasks: Array<{ name: string; fn: () => Promise<void>; condition?: () => boolean }>
) {
  const activeTasks = tasks.filter((task) => !task.condition || task.condition())

  if (activeTasks.length === 0) {
    return
  }

  console.info(`\nStarting parallel tasks: ${activeTasks.map((t) => t.name).join(', ')}`)

  const taskStartTime = Date.now()

  try {
    await Promise.all(
      activeTasks.map(async (task) => {
        const startTime = Date.now()
        try {
          await task.fn()
          const duration = Date.now() - startTime
          console.info(
            `\x1b[32m✓\x1b[0m task: \x1b[35m${task.name}\x1b[0m completed in \x1b[33m${formatDuration(duration)}\x1b[0m`
          )
        } catch (error) {
          const duration = Date.now() - startTime
          console.error(`✗ task: ${task.name} failed after ${formatDuration(duration)}`)
          throw error
        }
      })
    )

    const totalDuration = Date.now() - taskStartTime
    console.info(
      `\nAll parallel tasks completed successfully in ${formatDuration(totalDuration)}`
    )
  } catch (error) {
    const totalDuration = Date.now() - taskStartTime
    console.error(`\nCI fail after ${formatDuration(totalDuration)} failed`)
    throw error
  }
}
