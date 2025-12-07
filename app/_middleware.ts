import '~/setupServer'

import { createMiddleware } from 'one'

import { analytics } from '~/features/analytics/analytics'

/**
 * Example middleware for now just reports errors to analytics
 * Can be used for private beta redirects or any sort of middleware
 */

export default createMiddleware(async ({ request, next }) => {
  const url = new URL(request.url)

  const response = await next()

  if (response && response.status >= 400) {
    const url = new URL(request.url)
    const endpoint = url.pathname
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
      errorMessage: errorMessage || `HTTP ${response.status}`,
      endpoint,
      method,
      responseBody,
    })
  }

  return response
})
