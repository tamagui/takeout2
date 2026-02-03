import { getAuthData } from '../state'
import { isInZeroMutation, mutatorContext } from './mutatorContext'

import type { AuthData } from '../types'

export function getQueryOrMutatorAuthData(): AuthData | null {
  if (isInZeroMutation()) {
    return mutatorContext().authData as AuthData
  }

  return getAuthData()
}
