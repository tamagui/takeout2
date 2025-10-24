import '~/setupServer'

import { createMiddleware } from 'one'
import { authServer } from '~/auth/server/authServer'
import { getJWTRequestCookie } from '~/auth/server/getJWTRequestCookie'
import { isValidJWT } from '~/auth/validateToken'
import { analytics } from '~/features/analytics/analytics'
import { ONE_SERVER_URL } from '~/server/env-server'

// match anything with extension
const fileExtensionRegex = /\/[^/]*\.[^/]+$/
const HOSTNAME = new URL(ONE_SERVER_URL).hostname

// match public prefixes
const publicPrefixes = ['/_one/', '/_/', '/api/', '/assets/']
const publicPrefixRegex = new RegExp(
  `^(${publicPrefixes.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`
)

const publicPaths = new Set(['/robots.txt', '/favicon.ico'])

export default createMiddleware(async ({ request, next }) => {
  const url = new URL(request.url)
  const pathname = url.pathname

  if (fileExtensionRegex.test(pathname)) {
    return await next()
  }

  const isOnCustomDomain =
    process.env.NODE_ENV === 'production' && url.hostname !== HOSTNAME

  const shouldCheckPrivateBetaAccess =
    !isOnCustomDomain &&
    !publicPaths.has(pathname) &&
    !publicPrefixRegex.test(pathname) &&
    !process.env.IS_TESTING

  if (shouldCheckPrivateBetaAccess) {
    // tauri check jwt
    const jwtToken = getJWTRequestCookie(request)

    let hasAccess = false

    if (jwtToken) {
      if (await isValidJWT(jwtToken)) {
        hasAccess = true
      } else {
        console.info(`[auth] invalid jwt`)
      }
    }

    if (!hasAccess) {
      const session = await authServer.api.getSession({
        headers: request.headers,
      })

      hasAccess = !!session
    }

    if (!hasAccess) {
      if (process.env.NODE_ENV === 'development') {
        console.info(`[auth] disallow`, { hasAccess }, request.headers)
      }
      return Response.redirect(new URL(`${ONE_SERVER_URL}/_/home`, request.url), 302)
    }
  }

  let response = await next()

  // custom domains support:
  if (isOnCustomDomain && response && url.hostname) {
    const cookieHeader = request.headers.get('cookie')
    const hasDomainCookie = cookieHeader?.includes('customDomainServerId=')

    if (!hasDomainCookie) {
      const { getDb } = await import('~/database/index')
      const { server } = await import('~/database/schema-public')
      const { eq } = await import('drizzle-orm')

      const serverResult = await getDb()
        .select()
        .from(server)
        .where(eq(server.domain, url.hostname))
        .limit(1)

      if (serverResult.length > 0) {
        const serverId = serverResult[0]?.id
        if (serverId) {
          const headers = new Headers(response.headers)
          headers.append(
            'Set-Cookie',
            `customDomainServerId=${serverId}; Path=/; SameSite=Lax; Max-Age=31536000`
          )
          response = new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
          })
        }
      }
    }
  }

  if (response && response.status >= 400) {
    const method = request.method

    let responseBody: any = null
    let errorCode: string | undefined
    let errorMessage: string | undefined

    try {
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        const clonedResponse = response.clone()
        responseBody = await clonedResponse.json()

        if (responseBody.error) {
          errorMessage = responseBody.error
        }
        if (responseBody.code) {
          errorCode = responseBody.code
        }
        if (responseBody.message) {
          errorMessage = responseBody.message
        }
      }
    } catch (error) {
      console.error('Failed to parse error response body:', error)
    }

    analytics.track('api_error', {
      status: response.status,
      errorCode,
      errorMessage,
      endpoint: pathname,
      method,
      responseBody,
    })
  }

  return response
})
