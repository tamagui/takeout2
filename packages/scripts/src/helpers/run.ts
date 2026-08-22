import { spawn } from 'node:child_process'
import { cpus } from 'node:os'

import {
  getIsExiting,
  notifyProcessHandlers,
  type ProcessHandler,
  type ProcessType,
} from '@take-out/run/helpers/process-state'

import type { Timer } from '@take-out/helpers'

export type { ProcessHandler, ProcessType }
export { getIsExiting }

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
  return promise
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
    interactive?: boolean
  },
) {
  const {
    env,
    cwd,
    silent,
    captureOutput,
    prefix,
    detached,
    timeout,
    timing,
    interactive,
  } = options || {}

  if (timing) {
    const name = typeof timing === 'string' ? timing : command
    const startTime = Date.now()
    try {
      const promise = runInternal()
      running[name] = promise
      const result = await promise
      const duration = Date.now() - startTime
      console.info(
        `\x1b[32m✓\x1b[0m \x1b[35m${name}\x1b[0m completed in \x1b[33m${formatDuration(duration)}\x1b[0m`,
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
    // respect TKO_SILENT env var for quiet mode in watch scenarios
    const effectiveSilent = silent || process.env.TKO_SILENT === '1'
    if (!effectiveSilent) {
      console.info(`$ ${command}${cwd ? ` (in ${cwd})` : ``}`)
    }

    let timeoutId: Timer | undefined
    let didTimeOut = false

    try {
      const shell = spawn('bash', ['-c', command], {
        env: { ...process.env, ...env },
        cwd,
        stdio: interactive ? 'inherit' : ['ignore', 'pipe', 'pipe'],
        detached: detached ?? false,
      })

      if (detached) {
        shell.unref()
      }

      notifyProcessHandlers(shell)

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
        if (!effectiveSilent) {
          const output = prefix ? `${coloredPrefix} ${text}` : text
          if (!prefix || !captureOutput) {
            const stream = isStderr ? process.stderr : process.stdout
            stream.write(output)
          }
        }
      }

      const processStream = (
        stream: NodeJS.ReadableStream | null,
        isStderr: boolean,
      ): Promise<string> => {
        return new Promise((resolve) => {
          if (effectiveSilent && !captureOutput) {
            resolve('')
            return
          }

          if (!stream) {
            resolve('')
            return
          }

          let buffer = ''
          let captured = ''

          stream.on('data', (chunk: Buffer) => {
            const text = buffer + chunk.toString()
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
          })

          stream.on('end', () => {
            // output any remaining buffer
            if (buffer) {
              captured += buffer
              if (!captureOutput || prefix) {
                writeOutput(buffer + '\n', isStderr)
              }
            }
            resolve(captured)
          })

          stream.on('error', (err) => {
            console.error(`Error reading stream!`, err)
            resolve(captured)
          })
        })
      }

      // process both streams and wait for exit
      const [stdout, stderr, exitCode] = await Promise.all([
        processStream(shell.stdout, false),
        processStream(shell.stderr, true),
        new Promise<number | null>((resolve) => {
          shell.on('close', (code) => resolve(code))
        }),
      ])

      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      if (detached) {
        return { stdout: '', stderr: '' }
      }

      // a command we killed for exceeding its timeout failed, whatever exit code
      // the kill happened to leave behind. shell.kill() signals the `bash -c`
      // wrapper, and whether that surfaces as 143, as null, or as 0 depends on
      // whether bash exec'd into the command or stayed its parent, so gating on
      // the code alone reports a killed command as a completed one. that is not
      // hypothetical: a production `wrangler deploy` was killed at its 10-minute
      // timeout and this returned success, so the release printed a green check
      // for a worker it never activated.
      if (exitCode !== 0 || didTimeOut) {
        const errorMsg = didTimeOut
          ? `Command timed out after ${timeout}ms: ${command}`
          : `Command failed with exit code ${exitCode}: ${command}`

        if (!silent && !getIsExiting()) {
          console.error(`run() error: ${errorMsg}: ${stderr || ''}`)
        }

        const error = new Error(errorMsg, { cause: { exitCode, stdout, stderr } })
        Error.captureStackTrace(error, runInternal)
        throw error
      }

      return { stdout, stderr, exitCode }
    } catch (error) {
      clearTimeout(timeoutId)
      if (!silent && !getIsExiting()) {
        // only show the error message, not the full object if it's our error
        if (error instanceof Error && (error as any).cause?.exitCode !== undefined) {
          // this is our controlled error, already logged above
        } else {
          console.error(`Error running command: ${command}`, error)
        }
      } else if (!silent && getIsExiting()) {
        // simple message when being killed due to another error
        const shortCmd = command.split(' ')[0]
        console.error(`${shortCmd} exiting due to earlier error`)
      }
      throw error
    }
  }
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
      `\x1b[32m✓\x1b[0m \x1b[35m${name}\x1b[0m completed in \x1b[33m${formatDuration(duration)}\x1b[0m`,
    )
    return result
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`✗ ${name} failed after ${formatDuration(duration)}`)
    throw error
  }
}

export async function runParallel(
  tasks: Array<{ name: string; fn: () => Promise<void>; condition?: () => boolean }>,
  options?: { maxParallelism?: number },
) {
  const activeTasks = tasks.filter((task) => !task.condition || task.condition())

  if (activeTasks.length === 0) {
    return
  }

  const maxParallelism = options?.maxParallelism ?? cpus().length
  console.info(`\nStarting parallel tasks: ${activeTasks.map((t) => t.name).join(', ')}`)
  console.info(`Max parallelism: ${maxParallelism}`)

  const taskStartTime = Date.now()

  try {
    const results: Promise<void>[] = []
    const executing: Set<Promise<void>> = new Set()

    for (const task of activeTasks) {
      const startTime = Date.now()
      const taskPromise = task.fn().then(
        () => {
          const duration = Date.now() - startTime
          console.info(
            `\x1b[32m✓\x1b[0m task: \x1b[35m${task.name}\x1b[0m completed in \x1b[33m${formatDuration(duration)}\x1b[0m`,
          )
          executing.delete(taskPromise)
        },
        (error: unknown) => {
          const duration = Date.now() - startTime
          console.error(`✗ task: ${task.name} failed after ${formatDuration(duration)}`)
          executing.delete(taskPromise)
          throw error
        },
      )

      results.push(taskPromise)
      executing.add(taskPromise)

      if (executing.size >= maxParallelism) {
        await Promise.race(executing)
      }
    }

    await Promise.all(results)

    const totalDuration = Date.now() - taskStartTime
    console.info(
      `\nAll parallel tasks completed successfully in ${formatDuration(totalDuration)}`,
    )
  } catch (error) {
    const totalDuration = Date.now() - taskStartTime
    console.error(`\nCI fail after ${formatDuration(totalDuration)} failed`)
    throw error
  }
}
