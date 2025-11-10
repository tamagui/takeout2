import { ensure } from '@vxrn/helpers'
import type { AuthData } from '../types'
import { mutatorContext } from './mutatorContext'

export const ensureLoggedIn = (): AuthData => {
  const { authData } = mutatorContext()
  ensure(authData, 'logged in')
  return authData
}
