export interface ExitHandlerOptions {
  onExit?: () => void
  exitCode?: number
  processName?: string
}

export function setupExitHandlers(options: ExitHandlerOptions = {}): {
  exit: (code?: number) => void
} {
  const { onExit, exitCode = 1, processName = 'Process' } = options
  let hasExited = false

  const handleExit = (code: number, signal?: string) => {
    if (hasExited) return
    hasExited = true

    if (signal) {
      console.info(`\n${processName} received ${signal}, cleaning up...`)
    }

    if (onExit) {
      try {
        onExit()
      } catch (error) {
        console.error(`Error during cleanup:`, error)
      }
    }

    process.exit(code)
  }

  process.on('exit', () => {
    if (!hasExited && onExit) {
      onExit()
    }
  })

  process.on('SIGINT', () => handleExit(130, 'SIGINT'))
  process.on('SIGTERM', () => handleExit(143, 'SIGTERM'))

  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error)
    handleExit(exitCode)
  })

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection at:', promise, 'reason:', reason)
    handleExit(exitCode)
  })

  return {
    exit: (code?: number) => handleExit(code ?? exitCode),
  }
}
