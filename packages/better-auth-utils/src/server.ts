/**
 * Server-side auth utilities for better-auth
 * - Session validation via cookies (web)
 * - JWT validation via JWKS (native apps)
 */

import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'

export interface ValidateTokenOptions {
  /** base URL for the auth server (e.g., https://myapp.com) */
  baseUrl: string
  /** optional issuer override for CI/test environments */
  forceIssuer?: string
  /** JWKS endpoint path, defaults to /api/auth/jwks */
  jwksPath?: string
}

export interface AuthData {
  id: string
  email?: string
  role: 'admin' | undefined
}

export class NotAuthenticatedError extends Error {}
export class InvalidTokenError extends Error {}

export interface CreateAuthValidatorOptions extends ValidateTokenOptions {
  /** better-auth server instance with api.getSession */
  authServer: {
    api: {
      getSession: (opts: { headers: Headers }) => Promise<{
        user: { id: string; email?: string | null; role?: string | null }
      } | null> | Promise<any>
    }
  }
}

/**
 * Create auth validation functions for your server
 * Returns getAuthDataFromRequest and validateAuthHeader
 */
export function createAuthValidator(options: CreateAuthValidatorOptions) {
  const { authServer, ...tokenOptions } = options

  /**
   * Get auth data from request - tries session cookies first, then JWT header
   * Session: web apps with cookies forwarded by zero
   * JWT: native apps (Tauri, React Native) using Authorization header
   */
  async function getAuthDataFromRequest(req: Request): Promise<AuthData | null> {
    // try session-based auth first (web - cookies forwarded by zero)
    try {
      const session = await authServer.api.getSession({ headers: req.headers })
      if (session?.user) {
        return {
          id: session.user.id,
          email: session.user.email || undefined,
          role: session.user.role === 'admin' ? 'admin' : undefined,
        }
      }
    } catch {
      // session auth failed, try JWT
    }

    // try authorization header (token-based auth for native/tauri)
    const authHeader = req.headers.get('authorization')
    const jwtToken = authHeader?.replace('Bearer ', '')

    if (jwtToken) {
      try {
        const payload = await validateToken(jwtToken, tokenOptions)
        const userId = (payload as any)?.id || payload?.sub
        if (userId) {
          return {
            id: userId as string,
            email: (payload as any).email as string | undefined,
            role: (payload as any).role === 'admin' ? 'admin' : undefined,
          }
        }
      } catch (err) {
        if (!(err instanceof InvalidTokenError)) {
          throw err
        }
      }
    }

    return null
  }

  /** throws NotAuthenticatedError if not authenticated */
  async function validateAuthHeader(req: Request): Promise<AuthData> {
    const auth = await getAuthDataFromRequest(req)
    if (!auth) {
      throw new NotAuthenticatedError('Not authenticated')
    }
    return auth
  }

  return {
    getAuthDataFromRequest,
    validateAuthHeader,
  }
}

// jwt validation for native apps

export async function validateToken(
  token: string,
  options: ValidateTokenOptions
): Promise<JWTPayload> {
  const { baseUrl, forceIssuer, jwksPath = '/api/auth/jwks' } = options
  const normalizedBaseUrl = removeTrailingSlash(baseUrl)
  const url = `${forceIssuer || normalizedBaseUrl}${jwksPath}`

  // create fresh JWKS fetcher each time to avoid stale key cache issues
  const JWKS = createRemoteJWKSet(new URL(url))

  try {
    const verifyOptions = forceIssuer
      ? {}
      : {
          issuer: normalizedBaseUrl,
          audience: normalizedBaseUrl,
        }

    const { payload } = await jwtVerify(token, JWKS, verifyOptions)

    return payload
  } catch (error) {
    throw new InvalidTokenError(`${error}`)
  }
}

export async function isValidJWT(
  token: string,
  options: ValidateTokenOptions
): Promise<boolean> {
  try {
    await validateToken(token, options)
    return true
  } catch {
    return false
  }
}

function removeTrailingSlash(str: string) {
  return str.replace(/\/$/, '')
}
