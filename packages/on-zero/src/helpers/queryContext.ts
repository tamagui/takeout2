import { createAsyncContext } from '@take-out/helpers'

import type { AuthData } from '../types'

const asyncContext = createAsyncContext<{ authData: AuthData | null }>()

export function queryAuthData(): AuthData | null {
  return asyncContext.get()?.authData ?? null
}

export function isInQueryContext() {
  return !!asyncContext.get()
}

export function runWithQueryContext<T>(
  context: { authData: AuthData | null },
  fn: () => T | Promise<T>
): Promise<T> {
  return asyncContext.run(context, fn)
}
