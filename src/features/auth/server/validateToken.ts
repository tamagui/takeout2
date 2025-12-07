import { createRemoteJWKSet, jwtVerify } from 'jose'

import { ONE_SERVER_URL } from '~/server/env-server'

export async function validateToken(token: string) {
  // In CI/test mode, we need to be flexible about issuer/audience validation
  // because the web app might be accessed via different hosts (0.0.0.0, localhost, 172.17.0.1, etc)
  const forceIssuer = process.env.FORCE_ISSUER
  const baseUrl = removeTrailingSlash(ONE_SERVER_URL)
  const url = new URL(`${forceIssuer || baseUrl}/api/auth/jwks`)

  try {
    const JWKS = createRemoteJWKSet(url)
    const verifyOptions = forceIssuer
      ? {}
      : {
          issuer: baseUrl,
          audience: baseUrl,
        }

    const { payload } = await jwtVerify(token, JWKS, verifyOptions)

    return payload
  } catch (error) {
    throw new InvalidTokenError(`${error}`)
  }
}

export async function isValidJWT(token: string) {
  try {
    await validateToken(token)
    return true
  } catch {
    return false
  }
}

export class InvalidTokenError extends Error {}

function removeTrailingSlash(token: string) {
  return token.replace(/\/$/, '')
}
