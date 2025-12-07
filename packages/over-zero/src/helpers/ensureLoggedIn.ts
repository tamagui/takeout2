import { ensure } from '@vxrn/helpers'

import { mutatorContext } from './mutatorContext'

import type { AuthData } from '../types'

export const ensureLoggedIn = (): AuthData => {
  const { authData } = mutatorContext()
  ensure(authData, 'logged in')
  return authData
}
