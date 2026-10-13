import {
  APP_ANALYTICS_EVENTS,
  isAppInstallationId,
  parseAppAnalyticsEvent,
  type AppAnalyticsEvent,
} from './analytics'

export type AppAnalyticsServerConfig = {
  endpoint: string | null | undefined
  token: string | null | undefined
  fetch?: typeof fetch
}

export type AppAnalyticsRequestResult =
  | { ok: true; event: AppAnalyticsEvent }
  | { ok: false; reason: 'invalid' | 'too-large' }

export async function parseAppAnalyticsRequest(
  request: Request,
): Promise<AppAnalyticsRequestResult> {
  const maxBodyBytes = 512
  const declaredLength = Number(request.headers.get('content-length'))
  if (Number.isFinite(declaredLength) && declaredLength > maxBodyBytes) {
    return { ok: false, reason: 'too-large' }
  }
  const reader = request.body?.getReader()
  const decoder = new TextDecoder()
  let body = ''
  let bytes = 0
  if (reader) {
    while (true) {
      const chunk = await reader.read()
      if (chunk.done) break
      bytes += chunk.value.byteLength
      if (bytes > maxBodyBytes) {
        await reader.cancel()
        return { ok: false, reason: 'too-large' }
      }
      body += decoder.decode(chunk.value, { stream: true })
    }
    body += decoder.decode()
  }
  let payload: unknown = null
  try {
    payload = JSON.parse(body)
  } catch {}
  const event = parseAppAnalyticsEvent(payload)
  return event ? { ok: true, event } : { ok: false, reason: 'invalid' }
}

export async function sendAppAnalyticsEvent(
  value: AppAnalyticsEvent,
  config: AppAnalyticsServerConfig,
): Promise<'accepted' | 'unconfigured' | 'failed'> {
  const event = parseAppAnalyticsEvent(value)
  if (!event) return 'failed'
  if (!config.endpoint || !config.token) return 'unconfigured'
  try {
    const response = await (config.fetch ?? fetch)(config.endpoint, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${config.token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(2_000),
    })
    return response.ok ? 'accepted' : 'failed'
  } catch {
    return 'failed'
  }
}

export async function sendAppSignupEvent(
  installationId: unknown,
  isDemo: boolean,
  config: AppAnalyticsServerConfig,
): Promise<'accepted' | 'unconfigured' | 'failed' | 'skipped'> {
  if (isDemo || !isAppInstallationId(installationId)) return 'skipped'
  return sendAppAnalyticsEvent(
    { event: APP_ANALYTICS_EVENTS.signup, installationId },
    config,
  )
}
