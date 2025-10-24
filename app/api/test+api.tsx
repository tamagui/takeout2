import type { Endpoint } from 'one'
import { CLOUDFLARE_REALTIME_AUTH_HEADER } from '~/server/env-server'

export const GET: Endpoint = async () => {
  console.info('???', CLOUDFLARE_REALTIME_AUTH_HEADER)

  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
}
