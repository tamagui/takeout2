export interface ErrorContext {
  userId?: string
  sessionId?: string
  url?: string
  userAgent?: string
  timestamp?: number
  additional?: Record<string, any>
}

export interface ErrorReport {
  error: Error
  errorMessage?: any[] // for forwarding console error
  context?: ErrorContext
  severity?: 'low' | 'medium' | 'high' | 'critical'
  tags?: Record<string, string>
}

export interface ErrorHandler {
  handleError(report: ErrorReport): void
  setupGlobalHandlers(): void
  teardownGlobalHandlers(): void
}

export interface PostHogError {
  name: string
  message: string
  stack?: string
  url?: string
  line?: number
  column?: number
  userAgent?: string
  timestamp: number
  severity: string
  tags?: Record<string, string>
  context?: Record<string, any>
}
