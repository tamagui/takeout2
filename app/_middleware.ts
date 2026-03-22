import type { Middleware } from 'one'

const middleware: Middleware = async ({ request, next }) => {
  const response = await next()

  if (response && response.status >= 400) {
    await trackApiError(response, request, new URL(request.url).pathname)
  }

  return response
}

async function trackApiError(response: Response, request: Request, pathname: string) {
  try {
    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('application/json')) return

    const body = await response.clone().json()
    const { analytics } = await import('~/features/analytics/analytics')

    analytics.track('api_error', {
      status: response.status,
      errorCode: body.code,
      errorMessage: body.error || body.message,
      endpoint: pathname,
      method: request.method,
      responseBody: body,
    })
  } catch {
    // ignore parse errors
  }
}

export default middleware
