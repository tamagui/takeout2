import { APP_ANALYTICS_INSTALLATION_HEADER } from 'contrast-better-auth/analytics'
import { authServer } from '~/auth/server/authServer'
import type { Endpoint } from 'one'

function nativePreviewCorsHeaders(request: Request): Headers | null {
  const origin = request.headers.get('origin')
  if (!origin) return null

  try {
    const requestUrl = new URL(request.url)
    const originUrl = new URL(origin)
    const forwardedHost = request.headers.get('x-forwarded-host')
    let requestHostname = requestUrl.hostname
    let requestProtocol = requestUrl.protocol
    if (forwardedHost !== null) {
      const normalizedForwardedHost = forwardedHost.toLowerCase()
      if (
        requestUrl.protocol !== 'https:' ||
        !requestUrl.hostname.endsWith('.workers.dev') ||
        request.headers.get('x-forwarded-proto') !== 'https' ||
        !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(
          normalizedForwardedHost,
        )
      ) {
        return null
      }
      requestHostname = normalizedForwardedHost
      requestProtocol = 'https:'
    }
    const requestMatch = requestHostname.match(
      /^([a-z0-9](?:[a-z0-9-]*[a-z0-9])?)\.contrast\.run$/,
    )
    const originMatch = originUrl.hostname.match(
      /^ios-([a-z0-9](?:[a-z0-9-]*[a-z0-9])?)\.contrast\.run$/,
    )
    const requestLoopback =
      requestHostname === 'localhost' ||
      requestHostname.endsWith('.localhost') ||
      requestHostname === '127.0.0.1' ||
      requestHostname === '[::1]'
    const originLoopback =
      originUrl.hostname === 'localhost' ||
      originUrl.hostname.endsWith('.localhost') ||
      originUrl.hostname === '127.0.0.1' ||
      originUrl.hostname === '[::1]'
    const allowed =
      (requestLoopback && originLoopback) ||
      (requestProtocol === 'https:' &&
        originUrl.protocol === 'https:' &&
        requestMatch !== null &&
        originMatch !== null &&
        requestMatch[1] === originMatch[1])
    if (!allowed) return null
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
