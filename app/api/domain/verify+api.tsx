import { resolve } from 'node:dns/promises'
import type { Endpoint } from 'one'
import { authServer } from '~/auth/server/authServer'

export const GET: Endpoint = async (request) => {
  const session = await authServer.api.getSession({
    headers: request.headers,
  })

  if (!session) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const domain = url.searchParams.get('domain')

  if (!domain) {
    return Response.json({ error: 'domain parameter required' }, { status: 400 })
  }

  try {
    const records = await resolve(domain)

    return Response.json({
      verified: records.length > 0,
      records,
    })
  } catch (error) {
    return Response.json({
      verified: false,
      error: error instanceof Error ? error.message : 'dns lookup failed',
    })
  }
}
