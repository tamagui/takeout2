import type { ChildProcess } from 'node:child_process'
import { spawn } from 'node:child_process'
import {
  addProcessHandler,
  setExitCleanupState,
  type ProcessHandler,
  type ProcessType,
} from './run'

type ExitCallback = (info: { signal: NodeJS.Signals | string }) => void | Promise<void>

interface HandleProcessExitReturn {
  addChildProcess: ProcessHandler
  cleanup: () => Promise<void>
  exit: (code?: number) => Promise<void>
}

async function getChildPids(parentPid: number): Promise<number[]> {
  try {
    const proc = spawn('pgrep', ['-P', parentPid.toString()], {
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    return new Promise((resolve) => {
      let output = ''
      proc.stdout?.on('data', (data) => {
        output += data.toString()
      })

      proc.on('close', () => {
        const childPids = output.trim().split('\n').filter(Boolean).map(Number)
        resolve(childPids)
      })
    })
  } catch (error) {
    console.error(`Error getting child PIDs for ${parentPid}: ${error}`)
    return []
  }
}

async function getAllDescendantPids(parentPid: number): Promise<number[]> {
  const childPids = await getChildPids(parentPid)
  const descendantPids = [...childPids]

  for (const childPid of childPids) {
    const grandchildren = await getAllDescendantPids(childPid)
    descendantPids.push(...grandchildren)
  }

  return descendantPids
}

async function killProcessTree(
  pid: number,
  signal: NodeJS.Signals = 'SIGTERM',
  forceful: boolean = false
): Promise<void> {
  try {
    const descendants = await getAllDescendantPids(pid)

    // first send the requested signal
    for (const descendantPid of descendants.reverse()) {
      try {
        process.kill(descendantPid, signal)
      } catch (_) {
        // process may already be gone
      }
    }

    if (pid && !Number.isNaN(pid)) {
      try {
        process.kill(pid, signal)
      } catch (_) {
        // process may already be gone
      }
    }

    // if forceful, wait briefly then send SIGKILL
    if (forceful && signal !== 'SIGKILL') {
      await new Promise((resolve) => setTimeout(resolve, 500))

      // send SIGKILL to any still-alive processes
      for (const descendantPid of descendants.reverse()) {
        try {
          process.kill(descendantPid, 'SIGKILL')
        } catch (_) {
          // process may already be gone
        }
      }

      if (pid && !Number.isNaN(pid)) {
        try {
          process.kill(pid, 'SIGKILL')
        } catch (_) {
          // process may already be gone
        }
      }
    }
  } catch (error) {
    console.error(`Error killing process tree for ${pid}: ${error}`)
  }
}

function isChildProcess(proc: ProcessType): proc is ChildProcess {
  return 'killed' in proc && typeof (proc as any).on === 'function'
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
  const allChildPids = new Set<number>()
  let cleaning = false

  const cleanup = async (signal: NodeJS.Signals | string = 'SIGTERM') => {
    if (cleaning) return
    cleaning = true

    // notify run.ts that we're in cleanup state
    setExitCleanupState(true)

    // wrap entire cleanup in a timeout to prevent hanging
    if (onExit) {
      try {
        await onExit({ signal })
      } catch (error) {
        console.error('Error in exit callback:', error)
      }
    }

    // skip cleanup if no processes to clean up
    if (processes.length === 0) {
      return
    }

    await Promise.all(
      processes.map(async (proc) => {
        if (proc.pid) {
          try {
            await killProcessTree(proc.pid, signal as NodeJS.Signals)
          } catch (error) {
            console.error(
              `Error during graceful shutdown of process ${proc.pid}: ${error}`
            )
          }
        }
      })
    )

    // wait a bit for processes to exit gracefully
    await new Promise((res) => setTimeout(res, 200))

    // force kill any remaining processes
    for (const proc of processes) {
      try {
        if (!proc.exitCode && proc.pid) {
          await killProcessTree(proc.pid, 'SIGTERM')
        }
      } catch (err) {
        // process already gone
      }
    }
  }

  const addChildProcess = (proc: ProcessType) => {
    processes.push(proc)

    // track pid if available
    const pid = (proc as any).pid
    if (pid) {
      allChildPids.add(pid)

      // for child processes, capture descendants once after a brief delay
      if (isChildProcess(proc)) {
        setTimeout(async () => {
          if (proc.pid) {
            try {
              const childPids = await getChildPids(proc.pid)
              for (const childPid of childPids) {
                allChildPids.add(childPid)
              }
            } catch {
              // ignore errors in background polling
            }
          }
        }, 300)
      }
    }
  }

  addProcessHandler(addChildProcess)

  const sigtermHandler = () => {
    cleanup('SIGTERM').then(() => {
      process.exit(0)
    })
  }

  const sigintHandler = () => {
    cleanup('SIGINT').then(() => {
      process.exit(0)
    })
  }

  // intercept process.exit to ensure cleanup
  const originalExit = process.exit
  process.exit = ((code?: number) => {
    cleanup('SIGTERM').then(() => {
      originalExit(code)
    })
  }) as typeof process.exit

  process.on('beforeExit', () => cleanup('SIGTERM'))
  process.on('SIGINT', sigintHandler)
  process.on('SIGTERM', sigtermHandler)

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
