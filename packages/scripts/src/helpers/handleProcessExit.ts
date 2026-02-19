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

// kill an entire process group (works because children are spawned with detached: true,
// which makes them process group leaders). negative pid = kill the whole group.
// this is synchronous, no pgrep needed, no races.
function killProcessGroup(
  pid: number,
  signal: NodeJS.Signals = 'SIGTERM',
  forceful: boolean = false
): void {
  // kill the process group (negative pid)
  try {
    process.kill(-pid, signal)
  } catch (_) {
    // group may already be gone, try the individual process
    try {
      process.kill(pid, signal)
    } catch (_) {
      // process already gone
    }
  }

  if (forceful && signal !== 'SIGKILL') {
    // schedule a SIGKILL followup
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

  const cleanup = (signal: NodeJS.Signals | string = 'SIGTERM'): Promise<void> => {
    // return existing cleanup promise if already running, so process.exit
    // override waits for the real cleanup instead of exiting early
    if (cleanupPromise) return cleanupPromise

    cleanupPromise = doCleanup(signal)
    return cleanupPromise
  }

  const doCleanup = async (signal: NodeJS.Signals | string) => {
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

    // kill process groups synchronously - no pgrep, no races
    // detached: true makes each child a process group leader,
    // so kill(-pid) gets the entire group in one syscall
    const isInterrupt = signal === 'SIGINT'
    const killSignal = isInterrupt ? 'SIGTERM' : (signal as NodeJS.Signals)

    for (const proc of processes) {
      if (proc.pid) {
        killProcessGroup(proc.pid, killSignal, isInterrupt)
      }
    }

    // brief wait for graceful shutdown
    await new Promise((res) => setTimeout(res, isInterrupt ? 80 : 200))

    // force kill any remaining
    for (const proc of processes) {
      if (proc.pid && !proc.exitCode) {
        killProcessGroup(proc.pid, 'SIGKILL')
      }
    }
  }

  const addChildProcess = (proc: ProcessType) => {
    processes.push(proc)
  }

  addProcessHandler(addChildProcess)

  let finalized = false

  const finalizeWithSignal = (signal: NodeJS.Signals, fallbackCode: number) => {
    if (finalized) return
    finalized = true
    process.off('SIGINT', sigintHandler)
    process.off('SIGTERM', sigtermHandler)
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
