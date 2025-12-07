import { processError } from './setupErrorHandling'

import type { ErrorContext } from './types'

export function handleError(
  error: Error,
  context?: Partial<ErrorContext>,
  severity?: 'low' | 'medium' | 'high' | 'critical'
): void {
  processError({
    error,
    context,
    severity,
  })
}
