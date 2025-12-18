import { createAsyncContext } from '@take-out/helpers'

import type { MutatorContext } from '../types'

const asyncContext = createAsyncContext<MutatorContext>()

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
  fn: () => T | Promise<T>
): Promise<T> {
  return asyncContext.run(context, fn)
}
