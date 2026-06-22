/**
 * Server-side auth utilities for better-auth
 * - Session validation via cookies (web)
 * - JWT validation via JWKS (native apps)
 */

import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'

export interface ValidateTokenOptions {
  /** base URL for the auth server (e.g., https://myapp.com) */
  baseUrl?: string
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

export type AuthServer = {
  api: {
    getSession: (opts: { headers: Headers }) =>
      | Promise<{
          user: { id: string; email?: string | null; role?: string | null }
        } | null>
      | Promise<any>
  }
}

/**
 * Get auth data from request - tries session first, then a JWKS-verified JWT.
 * Session: web cookies (forwarded by zero) and native bearer tokens resolved by
 *   the better-auth bearer() plugin — both handled by getSession.
 * JWT: only for servers using the jwt() plugin instead of bearer().
 */
export async function getAuthDataFromRequest(
  authServer: AuthServer,
  req: Request,
  tokenOptions?: ValidateTokenOptions,
): Promise<AuthData | null> {
  const authHeader = req.headers.get('authorization')

  // try session-based auth first, passing the request headers THROUGH UNTOUCHED:
  // - web sends the forwarded session cookie.
  // - native (React Native / Tauri) sends `Authorization: Bearer <session-token>`,
  //   which the better-auth bearer() plugin verifies and rewrites into the session
  //   cookie internally (with the correct cookie name).
  // do NOT rewrite the Cookie header from the bearer value: the bearer token is
  // not a `name=value` cookie, so it never matched a real session cookie, and
  // overwriting an existing forwarded cookie with it silently dropped authenticated
  // web requests (cookie + bearer both present) to an `anon` identity.
  try {
    const session = await authServer.api.getSession({ headers: req.headers })
    if (session?.user) {
      return {
        id: session.user.id,
        email: session.user.email || undefined,
        role: session.user.role === 'admin' ? 'admin' : undefined,
      }
    }
  } catch (err) {
    console.warn(`Error validating session`, err)
    // session auth failed, try JWT
  }

  // fall back to JWKS-verified JWT for servers using the jwt() plugin (no
  // bearer() plugin to resolve the token above).
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

// jwt validation for native apps

export async function validateToken(
  token: string,
  options?: ValidateTokenOptions,
): Promise<JWTPayload> {
  const {
    baseUrl = process.env.ONE_SERVER_URL,
    forceIssuer = process.env.FORCE_ISSUER || '',
    jwksPath = '/api/auth/jwks',
  } = options || {}

  if (!baseUrl) {
    throw new Error(`No baseURL!`)
  }

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
  options: ValidateTokenOptions,
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
