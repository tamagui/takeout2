import type { Endpoint } from 'one'

const POSTHOG_API = 'https://us.i.posthog.com'
const POSTHOG_API_KEY = process.env.VITE_POSTHOG_API_KEY

// rate limit: simple in-memory store (resets on server restart)
const rateLimits = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 60_000 // 1 minute
const RATE_LIMIT_MAX = 100 // max events per window per ip

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimits.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return false
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return true
  }

  entry.count++
  return false
}

// valid event names to prevent abuse
const ALLOWED_EVENTS = new Set([
  // pageview events
  '$pageview',
  '$pageleave',
  // custom events
  'feature_used',
  'post_created',
  'post_deleted',
  'user_signup',
  'user_login',
  'user_logout',
  'profile_updated',
  'error_occurred',
])

type CaptureBody = {
  event: string
  properties?: Record<string, unknown>
  distinct_id?: string
}

type IdentifyBody = {
  distinct_id: string
  properties?: Record<string, unknown>
}

type DecideBody = {
  distinct_id: string
}

export const POST: Endpoint = async (request) => {
  if (!POSTHOG_API_KEY) {
    return Response.json({ error: 'analytics not configured' }, { status: 503 })
  }

  // get client ip for rate limiting
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'

  if (isRateLimited(ip)) {
    return Response.json({ error: 'rate limited' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const action = body?.action as string

    switch (action) {
      case 'capture': {
        const { event, properties, distinct_id } = body as CaptureBody

        if (!event || typeof event !== 'string') {
          return Response.json({ error: 'invalid event' }, { status: 400 })
        }

        // validate event name
        if (!ALLOWED_EVENTS.has(event) && !event.startsWith('$')) {
          return Response.json({ error: 'event not allowed' }, { status: 400 })
        }

        await fetch(`${POSTHOG_API}/capture/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: POSTHOG_API_KEY,
            event,
            distinct_id: distinct_id || 'anonymous',
            properties: {
              ...properties,
              $ip: ip,
            },
          }),
        })

        return Response.json({ ok: true })
      }

      case 'identify': {
        const { distinct_id, properties } = body as IdentifyBody

        if (!distinct_id || typeof distinct_id !== 'string') {
          return Response.json({ error: 'invalid distinct_id' }, { status: 400 })
        }

        await fetch(`${POSTHOG_API}/capture/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: POSTHOG_API_KEY,
            event: '$identify',
            distinct_id,
            properties: {
              $set: properties,
            },
          }),
        })

        return Response.json({ ok: true })
      }

      case 'decide': {
        const { distinct_id } = body as DecideBody

        const response = await fetch(`${POSTHOG_API}/decide/?v=3`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: POSTHOG_API_KEY,
            distinct_id: distinct_id || 'anonymous',
          }),
        })

        const data = await response.json()
        return Response.json({
          featureFlags: data.featureFlags || {},
        })
      }

      default:
        return Response.json({ error: 'invalid action' }, { status: 400 })
    }
  } catch {
    return Response.json({ error: 'invalid request' }, { status: 400 })
  }
}
