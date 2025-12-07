import { ensureExists } from '@take-out/helpers'

import { ensureAuth } from './ensureAuth'

export class NotAuthorizedError extends Error {}

export async function ensureAdminUser(req: Request) {
  const { session, user } = await ensureAuth(req)

  if (user.role !== 'admin') {
    throw new Error(`Not allowed: not admin`)
  }

  ensureExists(user, 'user')
  return { user, session }
}
