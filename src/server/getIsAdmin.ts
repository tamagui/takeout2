import type { AuthData } from '~/features/auth/types'
import { ensure } from '@tamatko/helpers'
import { ADMIN_WHITELIST } from '~/server/constants-server'

export const getIsAdmin = (authData: AuthData) =>
  authData && (authData.role === 'admin' || ADMIN_WHITELIST.has(authData.email || ''))

export function ensureAdmin(authData: AuthData) {
  ensure(getIsAdmin(authData))
}
