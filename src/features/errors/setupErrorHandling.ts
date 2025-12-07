import { isWeb } from 'tamagui'

import { postHog } from '../../posthog/posthog'

import type { ErrorReport } from './types'

let ogWindowErrorHandler: OnErrorEventHandler | null = null
let ogUnhandledRejectionHandler: ((event: PromiseRejectionEvent) => void) | null = null
let handlersSetup = false

export function initializeErrorHandling(): void {
  if (process.env.NODE_ENV === 'development') {
    // avoid all error tracking in development
    return
  }

  if (!isWeb) {
    // TODO we need to setup native
    return
  }

  if (handlersSetup) {
    return
  }

  setupWebHandlers()
  setupNodeHandlers()
  handlersSetup = true
}

export function processError(report: ErrorReport): void {
  const { error, context = {}, severity = 'medium', tags } = report

  // in dev mode, just log to console instead of sending to PostHog
  // only send to PostHog in production
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

  if (!ogUnhandledRejectionHandler) {
    ogUnhandledRejectionHandler = window.onunhandledrejection
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
  if (process.env.VITE_ENVIRONMENT === 'ssr') {
    if (typeof process !== 'undefined') {
      process.on('unhandledRejection', (reason, promise) => {
        processError({
          error: new Error(`Unhandled rejection at ${promise} ${reason}`),
          severity: 'high',
        })
      })
    }
  }
}

export function teardownErrorHandling(): void {
  if (typeof window !== 'undefined') {
    if (ogWindowErrorHandler !== null) {
      window.onerror = ogWindowErrorHandler
      ogWindowErrorHandler = null
    }

    if (ogUnhandledRejectionHandler !== null) {
      window.onunhandledrejection = ogUnhandledRejectionHandler
      ogUnhandledRejectionHandler = null
    }
  }

  handlersSetup = false
}
