export class AbortError extends Error {
  constructor(message = '') {
    super(message)
    this.name = 'AbortError'
  }
}

export class EnsureError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EnsureError'
  }
}

export type ErrorCode =
  | 'CONTENT_POLICY_VIOLATION'
  | 'PROFANITY_DETECTED'
  | 'NOT_AUTHENTICATED'
  | 'NOT_AUTHORIZED'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR'

export class AppError extends Error {
  code: ErrorCode
  details?: Record<string, unknown>

  constructor(code: ErrorCode, message: string, details?: Record<string, unknown>) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.details = details
  }

  toJSON(): {
    code: ErrorCode
    message: string
    details: Record<string, unknown> | undefined
  } {
    return { code: this.code, message: this.message, details: this.details }
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

export function getErrorInfo(error: unknown): { code: ErrorCode; message: string } {
  if (isAppError(error)) {
    return { code: error.code, message: error.message }
  }
  if (error instanceof Error) {
    return { code: 'INTERNAL_ERROR', message: error.message }
  }
  return { code: 'INTERNAL_ERROR', message: String(error) }
}
