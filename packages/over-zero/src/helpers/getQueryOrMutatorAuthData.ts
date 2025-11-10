import { getAuthData } from '../state'
import type { AuthData } from '../types'
import { isInZeroMutation, mutatorContext } from './mutatorContext'

export function getQueryOrMutatorAuthData(): AuthData | null {
  if (isInZeroMutation()) {
    return mutatorContext().authData as AuthData
  }

  return getAuthData()
}
