import { ensure } from '@take-out/helpers'

import { isInZeroMutation, mutatorContext } from './helpers/mutatorContext'
import { getContext } from './state'

import type { AuthData, Context } from './types'

// works in any query or mutation
export function getAuth(): AuthData | null {
  if (isInZeroMutation()) {
    return mutatorContext().auth as AuthData | null
  }
  return getContext().auth as AuthData | null
}

// works in any query or mutation, throws if not authenticated
export function ensureAuth(): AuthData {
  const auth = getAuth()
  ensure(auth, 'authenticated')
  return auth
}

export function queryContext(): Context {
  if (isInZeroMutation()) {
    return mutatorContext() as Context
  }
  return getContext()
}

export function query<Props, Return>(
  fn: (props: Props, ctx: Context) => Return
): (props: Props) => Return {
  return (props: Props) => fn(props, queryContext())
}
