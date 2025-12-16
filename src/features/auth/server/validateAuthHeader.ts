import { InvalidTokenError, validateToken } from './validateToken'

import type { JWTPayload } from '../types'
import type { AuthData } from 'over-zero'

export async function validateAuthHeader(req: Request) {
  const payload = await getAuthHeader(req)
  if (!payload) {
    throw new NotAuthenticatedError(`Not authenticated: no authorization header`)
  }
  return payload
}

export class NotAuthenticatedError extends Error {}

export async function getAuthHeader(req: Request) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  try {
    return token ? ((await validateToken(token)) as unknown as JWTPayload) : null
  } catch (err) {
    if (err instanceof InvalidTokenError) {
      return null
    }
    throw err
  }
}

export async function getAuthDataFromRequest(request: Request): Promise<AuthData | null> {
  const auth = await getAuthHeader(request)
  // use sub as fallback for id (standard JWT uses sub for subject/user id)
  const userId = auth?.id || auth?.sub

  return auth && userId
    ? {
        email: auth.email,
        id: userId,
        role: auth.role === 'admin' ? 'admin' : undefined,
      }
    : null
}
