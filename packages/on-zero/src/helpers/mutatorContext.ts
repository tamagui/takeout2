import { createAsyncContext } from '@take-out/helpers'

import type { AuthData, MutatorContext } from '../types'

type AsyncContext<T> = ReturnType<typeof createAsyncContext<T>>

const contextStore = globalThis as typeof globalThis & {
  __onZeroMutatorContext__?: AsyncContext<MutatorContext>
  __onZeroAuthScopeContext__?: AsyncContext<AuthData | null>
}

const asyncContext =
  contextStore.__onZeroMutatorContext__ ??
  (contextStore.__onZeroMutatorContext__ = createAsyncContext<MutatorContext>())

// lightweight auth-only scope for async tasks (where mutation context is gone but authData is needed)
const authScopeContext =
  contextStore.__onZeroAuthScopeContext__ ??
  (contextStore.__onZeroAuthScopeContext__ = createAsyncContext<AuthData | null>())

export function mutatorContext(): MutatorContext {
  const currentContext = asyncContext.get()
  if (!currentContext) {
    throw new Error('mutatorContext must be called within a mutator')
  }

  return currentContext
}

export function isInZeroMutation() {
  return !!asyncContext.get()
}

export function runWithContext<T>(
  context: MutatorContext,
  fn: () => T | Promise<T>,
): Promise<T> {
  return asyncContext.run(context, fn)
}

// auto-resolve authData from mutation context or auth scope
export function getScopedAuthData(): AuthData | null | undefined {
  if (isInZeroMutation()) {
    return mutatorContext().authData
  }
  return authScopeContext.get() ?? undefined
}

export function runWithAuthScope<T>(
  authData: AuthData | null,
  fn: () => T | Promise<T>,
): Promise<T> {
  return authScopeContext.run(authData, fn)
}
