import { isValidJWT } from '@take-out/better-auth-utils/server'

import { ONE_SERVER_URL } from '~/server/env-server'

import type { Endpoint } from 'one'

// endpoint for native apps to validate JWT tokens
export const POST: Endpoint = async (req) => {
  const body = await req.json()
  if (body && typeof body.token === 'string') {
    try {
      const valid = await isValidJWT(body.token, {
        baseUrl: ONE_SERVER_URL,
        forceIssuer: process.env.FORCE_ISSUER,
      })
      return Response.json({ valid })
    } catch (err) {
      console.error(`Error validating token`, err)
    }
    return Response.json({ valid: false })
  }

  return Response.json({ valid: false })
}
