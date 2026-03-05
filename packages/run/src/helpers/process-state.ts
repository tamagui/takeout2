import { type ChildProcess } from 'node:child_process'

export type ProcessType = ChildProcess
export type ProcessHandler = (process: ProcessType) => void

// shared state: tracks if we're in cleanup (another process failed)
let isInExitCleanup = false

export function setExitCleanupState(state: boolean) {
  isInExitCleanup = state
}

export function getIsExiting() {
  return isInExitCleanup
}

// handlers called when any process is spawned via run()
const processHandlers = new Set<ProcessHandler>()

export const addProcessHandler = (cb: ProcessHandler) => {
  processHandlers.add(cb)
}

export function notifyProcessHandlers(proc: ProcessType) {
  processHandlers.forEach((cb) => cb(proc))
}
