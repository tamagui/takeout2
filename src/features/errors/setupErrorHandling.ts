import { postHog } from '../../posthog/posthog'
import type { ErrorReport } from './types'

let ogWindowErrorHandler: OnErrorEventHandler | null = null
let handlersSetup = false

export function initializeErrorHandling(): void {
  if (handlersSetup) {
    return
  }

  if (typeof document !== 'undefined') {
    setupWebHandlers()
  } else if (typeof process !== 'undefined' && typeof process.on === 'function') {
    setupNodeHandlers()
  }

  handlersSetup = true
}

export function processError(report: ErrorReport): void {
  const { error, context = {}, severity = 'medium', tags } = report

  postHog.captureException(error, {
    ...tags,
    severity,
    url: context.url,
    userAgent: context.userAgent,
    timestamp: context.timestamp || Date.now(),
    ...context.additional,
  })

  if (severity === 'critical' || severity === 'high') {
    console.error('[handleError]', error)
  }
}

function setupWebHandlers(): void {
  if (typeof window === 'undefined') {
    return
  }

  if (!ogWindowErrorHandler) {
    ogWindowErrorHandler = window.onerror
  }

  window.onerror = (message, source, lineno, colno, error) => {
    ogWindowErrorHandler?.(message, source, lineno, colno, error)

    const actualError = error || new Error(String(message))
    processError({
      error: actualError,
      context: {
        url: source,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        additional: { line: lineno, column: colno },
      },
      severity: 'high',
      tags: { source: 'window.onerror' },
    })

    return false
  }

  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const error =
      event.reason instanceof Error ? event.reason : new Error(String(event.reason))

    processError({
      error,
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
      },
      severity: 'high',
      tags: { source: 'unhandled_promise_rejection' },
    })
  })
}

function setupNodeHandlers() {
  if (typeof window !== 'undefined') return

  process.on('uncaughtException', (error) => {
    console.error(`[uncaughtException]`, error)
    processError({
      error,
      severity: 'critical',
      tags: { source: 'uncaught_exception' },
    })
    // don't exit - keep the server alive for recoverable errors like pg-protocol parser crashes
  })

  process.on('unhandledRejection', (reason) => {
    const error = reason instanceof Error ? reason : new Error(String(reason))
    console.error(`[unhandledRejection]`, error)
    processError({
      error,
      severity: 'high',
      tags: { source: 'unhandled_rejection' },
    })
  })
}
