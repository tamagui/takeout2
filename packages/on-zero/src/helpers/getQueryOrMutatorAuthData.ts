import { getAuthData } from '../state'
import { isInZeroMutation, mutatorContext } from './mutatorContext'
import { isInQueryContext, queryAuthData } from './queryContext'

import type { AuthData } from '../types'

export function getQueryOrMutatorAuthData(): AuthData | null {
  if (isInZeroMutation()) {
    return mutatorContext().authData as AuthData
  }
  if (isInQueryContext()) {
    return queryAuthData()
  }
  // client-side fallback (browser global is fine, single-threaded)
  return getAuthData()
}
