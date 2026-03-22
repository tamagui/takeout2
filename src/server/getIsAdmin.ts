import { ensure } from '@take-out/helpers'

import { ADMIN_WHITELIST } from '~/server/constants-server'

import type { AuthData } from '~/features/auth/types'

export const getIsAdmin = (authData?: AuthData | null) =>
  authData && (authData.role === 'admin' || ADMIN_WHITELIST.has(authData.email || ''))

export function ensureAdmin(authData?: AuthData | null) {
  ensure(getIsAdmin(authData), `is admin`)
}
