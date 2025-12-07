import { validateToken } from '~/features/auth/server/validateToken'

import type { Endpoint } from 'one'

export const POST: Endpoint = async (req) => {
  const body = await req.json()
  if (body && typeof body.token === 'string') {
    try {
      const found = await validateToken(body.token)
      return Response.json({
        valid: !!found,
      })
    } catch (err) {
      console.error(`Error validating token`, err)
    }
    return Response.json({ valid: false })
  }

  return Response.json({ valid: false })
}
