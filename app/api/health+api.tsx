import type { Endpoint } from 'one'

export const GET: Endpoint = async () => {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
}
