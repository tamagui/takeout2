import { execSync } from 'node:child_process'
import { appendFileSync, rmSync } from 'node:fs'

import {
  addProcessHandler,
  setExitCleanupState,
  type ProcessHandler,
  type ProcessType,
} from './process-state'

type ExitCallback = (info: { signal: string }) => void | Promise<void>

interface HandleProcessExitReturn {
  addChildProcess: ProcessHandler
  cleanup: () => Promise<void>
  exit: (code?: number) => Promise<void>
}

const pidFilePath = `/tmp/tko-run-${process.pid}.pids`

function writePidFile(pid: number) {
  try {
    appendFileSync(pidFilePath, `${pid}\n`)
  } catch {}
}

function removePidFile() {
  try {
    rmSync(pidFilePath, { force: true })
  } catch {}
}

// find descendant pids that survived the group kill
// uses pgrep -P instead of ps (ps is a setuid binary blocked by sandbox-exec)
function findStragglers(trackedPids: number[]): number[] {
  try {
    const descendants = new Set<number>()
    const queue = [...trackedPids]
    while (queue.length > 0) {
      const current = queue.pop()!
      try {
        const output = execSync(`pgrep -P ${current}`, {
          encoding: 'utf-8',
          timeout: 2000,
        })
        for (const line of output.trim().split('\n')) {
          const pid = parseInt(line, 10)
          if (!isNaN(pid) && !descendants.has(pid)) {
            descendants.add(pid)
            queue.push(pid)
          }
        }
      } catch {
        // pgrep exits 1 when no children found, that's fine
      }
    }
    return [...descendants]
  } catch {
    return []
  }
}

// kill entire process group to prevent orphaned descendants
function killProcess(
  pid: number,
  signal: NodeJS.Signals = 'SIGTERM',
  forceful: boolean = false,
): void {
  // kill process group first (negative pid), then direct process
  try {
    process.kill(-pid, signal)
  } catch (_) {}
  try {
    process.kill(pid, signal)
  } catch (_) {}

  if (forceful && signal !== 'SIGKILL') {
    setTimeout(() => {
      try {
        process.kill(-pid, 'SIGKILL')
      } catch (_) {}
      try {
        process.kill(pid, 'SIGKILL')
      } catch (_) {}
    }, 100)
  }
}

let isHandling = false

export function handleProcessExit({
  onExit,
}: {
  onExit?: ExitCallback
} = {}): HandleProcessExitReturn {
  if (isHandling) {
    throw new Error(`Only one handleProcessExit per process should be registered!`)
  }

  isHandling = true
  const processes: ProcessType[] = []
  let cleanupPromise: Promise<void> | null = null

  const cleanup = (signal: string = 'SIGTERM'): Promise<void> => {
    // return existing cleanup promise if already running, so process.exit
    // override waits for the real cleanup instead of exiting early
    if (cleanupPromise) return cleanupPromise

    cleanupPromise = doCleanup(signal)
    return cleanupPromise
  }

  const doCleanup = async (signal: string) => {
    setExitCleanupState(true)

    if (onExit) {
      try {
        await onExit({ signal })
      } catch (error) {
        console.error('Error in exit callback:', error)
      }
    }

    if (processes.length === 0) {
      return
    }

    const isInterrupt = signal === 'SIGINT'
    const killSignal = isInterrupt ? 'SIGTERM' : (signal as NodeJS.Signals)

    for (const proc of processes) {
      if (proc.pid) {
        killProcess(proc.pid, killSignal, isInterrupt)
      }
    }

    // brief wait for graceful shutdown
    await new Promise((res) => setTimeout(res, isInterrupt ? 80 : 200))

    // force kill any remaining
    for (const proc of processes) {
      if (proc.pid && !proc.exitCode) {
        killProcess(proc.pid, 'SIGKILL')
      }
    }

    // straggler walk: find any descendants that survived the group kill
    const trackedPids = processes.map((p) => p.pid).filter(Boolean) as number[]
    if (trackedPids.length > 0) {
      const stragglers = findStragglers(trackedPids)
      for (const pid of stragglers) {
        try {
          process.kill(pid, 'SIGKILL')
        } catch {}
      }
    }

    removePidFile()
  }

  const addChildProcess = (proc: ProcessType) => {
    processes.push(proc)
    if (proc.pid) writePidFile(proc.pid)
  }

  addProcessHandler(addChildProcess)

  let finalized = false

  const finalizeWithSignal = (signal: NodeJS.Signals, fallbackCode: number) => {
    if (finalized) return
    finalized = true
    process.off('SIGINT', sigintHandler)
    process.off('SIGTERM', sigtermHandler)
    process.off('SIGHUP', sighupHandler)
    process.off('beforeExit', beforeExitHandler)
    process.exit = originalExit

    try {
      process.kill(process.pid, signal)
    } catch {
      originalExit(fallbackCode)
    }
  }

  const sigtermHandler = () => {
    cleanup('SIGTERM').then(() => {
      finalizeWithSignal('SIGTERM', 143)
    })
  }

  const sigintHandler = () => {
    cleanup('SIGINT').then(() => {
      finalizeWithSignal('SIGINT', 130)
    })
  }

  const sighupHandler = () => {
    cleanup('SIGHUP').then(() => {
      finalizeWithSignal('SIGHUP', 129)
    })
  }

  // intercept process.exit to ensure cleanup completes before exiting.
  // if cleanup is already running, this awaits the SAME promise instead of
  // early-returning and calling originalExit prematurely.
  const originalExit = process.exit
  process.exit = ((code?: number) => {
    cleanup('SIGTERM').then(() => {
      originalExit(code)
    })
  }) as typeof process.exit

  const beforeExitHandler = () => cleanup('SIGTERM')
  process.on('beforeExit', beforeExitHandler)
  process.on('SIGINT', sigintHandler)
  process.on('SIGTERM', sigtermHandler)
  process.on('SIGHUP', sighupHandler)

  const exit = async (code: number = 0) => {
    await cleanup('SIGTERM')
    process.exit(code)
  }

  return {
    addChildProcess,
    cleanup,
    exit,
  }
}
