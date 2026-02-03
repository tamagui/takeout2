import { ensure } from '@take-out/helpers'

import { mutatorContext } from './mutatorContext'

import type { AuthData } from '../types'

export const ensureLoggedIn = (): AuthData => {
  const { authData } = mutatorContext()
  ensure(authData, 'logged in')
  return authData
}
