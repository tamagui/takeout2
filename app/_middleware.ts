import { createMiddleware } from 'one'

import { analytics } from '~/features/analytics/analytics'

/**
 * Example middleware for now just reports errors to analytics
 * Can be used for private beta redirects or any sort of middleware
 */

export default createMiddleware(async ({ request, next }) => {
  const response = await next()

  if (response && response.status >= 400) {
    const url = new URL(request.url)
    const endpoint = url.pathname
    const method = request.method

    let responseBody: Record<string, unknown> | null = null
    let errorCode: string | undefined
    let errorMessage: string | undefined

    try {
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        const clonedResponse = response.clone()
        responseBody = (await clonedResponse.json()) as Record<string, unknown>

        if (typeof responseBody.error === 'string') {
          errorMessage = responseBody.error
        }
        if (typeof responseBody.code === 'string') {
          errorCode = responseBody.code
        }
        if (typeof responseBody.message === 'string') {
          errorMessage = responseBody.message
        }
      }
    } catch (error) {
      console.error('Failed to parse error response body:', error)
    }

    analytics.track('api_error', {
      status: response.status,
      errorCode,
      errorMessage: errorMessage || `HTTP ${response.status}`,
      endpoint,
      method,
      responseBody,
    })
  }

  return response
})
