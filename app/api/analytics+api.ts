import {
  parseAppAnalyticsRequest,
  sendAppAnalyticsEvent,
} from 'takeout-better-auth/analytics/server'
import type { Endpoint } from 'one'

export const POST: Endpoint = async (request) => {
  const parsed = await parseAppAnalyticsRequest(request)
  if (!parsed.ok) {
    return new Response(null, { status: parsed.reason === 'too-large' ? 413 : 400 })
  }
  const result = await sendAppAnalyticsEvent(parsed.event, {
    endpoint: process.env.APP_ANALYTICS_URL,
    token: process.env.APP_ANALYTICS_TOKEN,
  })
  return new Response(null, {
    status: result === 'failed' ? 502 : result === 'unconfigured' ? 204 : 202,
  })
}
