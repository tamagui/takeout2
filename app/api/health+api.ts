import type { Endpoint } from 'one'

export const GET: Endpoint = async () => {
  return Response.json({
    status: 'ok',
    sha: process.env.GIT_SHA || 'unknown',
    env: process.env.NODE_ENV || 'unknown',
    timestamp: new Date().toISOString(),
  })
}
