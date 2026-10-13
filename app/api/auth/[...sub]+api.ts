import { APP_ANALYTICS_INSTALLATION_HEADER } from 'takeout-better-auth/analytics'
import { authServer } from '~/auth/server/authServer'
import type { Endpoint } from 'one'

function isLoopback(hostname: string) {
  return (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]'
  )
}

function nativePreviewCorsHeaders(request: Request): Headers | null {
  const origin = request.headers.get('origin')
  if (!origin) return null

  try {
    const requestHostname = new URL(request.url).hostname
    const originHostname = new URL(origin).hostname
    if (!isLoopback(requestHostname) || !isLoopback(originHostname)) return null
  } catch {
    return null
  }

  return new Headers({
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': `authorization, content-type, mobile-origin, ${APP_ANALYTICS_INSTALLATION_HEADER}`,
    'access-control-expose-headers': 'set-auth-token',
    'access-control-max-age': '3600',
    vary: 'origin',
  })
}

const handler: Endpoint = async (request) => {
  const response = await authServer.handler(request)
  const corsHeaders = nativePreviewCorsHeaders(request)
  if (!corsHeaders) return response

  const headers = new Headers(response.headers)
  corsHeaders.forEach((value, name) => headers.set(name, value))
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

export const GET = handler
export const POST = handler
export const OPTIONS: Endpoint = (request) => {
  const headers = nativePreviewCorsHeaders(request)
  return new Response(null, {
    status: headers ? 204 : 403,
    headers: headers ?? undefined,
  })
}
