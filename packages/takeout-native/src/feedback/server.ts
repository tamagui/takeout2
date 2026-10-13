import { MAX_FEEDBACK_REPORT_BODY_BYTES } from './limits'

export type FeedbackForwardConfig = {
  endpoint: string | null | undefined
  token: string | null | undefined
  fetch?: typeof fetch
  timeoutMs?: number
}

type BoundedBodyResult =
  | { ok: true; body: string }
  | { ok: false; status: 400 | 413; message: string }

function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status })
}

async function readBoundedBody(request: Request): Promise<BoundedBodyResult> {
  const declaredLength = Number(request.headers.get('content-length'))
  if (
    Number.isFinite(declaredLength) &&
    declaredLength > MAX_FEEDBACK_REPORT_BODY_BYTES
  ) {
    return { ok: false, status: 413, message: 'feedback report is too large' }
  }
  if (!request.body) {
    return { ok: false, status: 400, message: 'feedback report is missing' }
  }

  const reader = request.body.getReader()
  const decoder = new TextDecoder()
  let body = ''
  let bytes = 0
  for (;;) {
    const chunk = await reader.read()
    if (chunk.done) break
    bytes += chunk.value.byteLength
    if (bytes > MAX_FEEDBACK_REPORT_BODY_BYTES) {
      await reader.cancel('feedback report is too large').catch(() => {})
      return { ok: false, status: 413, message: 'feedback report is too large' }
    }
    body += decoder.decode(chunk.value, { stream: true })
  }
  body += decoder.decode()
  return body.trim()
    ? { ok: true, body }
    : { ok: false, status: 400, message: 'feedback report is missing' }
}

// generated apps terminate the untrusted device request at their own server.
// only the bounded json body crosses to the feedback endpoint, authenticated
// with the write token configured on that deployment. caller
// headers are intentionally not forwarded.
export async function forwardFeedback(
  request: Request,
  config: FeedbackForwardConfig,
): Promise<Response> {
  if (!config.endpoint || !config.token) {
    return jsonError('feedback is not configured for this deployment', 503)
  }
  const contentType = request.headers.get('content-type')?.toLowerCase() ?? ''
  if (!contentType.startsWith('application/json')) {
    return jsonError('feedback report must be JSON', 415)
  }

  let bounded: BoundedBodyResult
  try {
    bounded = await readBoundedBody(request)
  } catch {
    return jsonError('could not read feedback report', 400)
  }
  if (!bounded.ok) return jsonError(bounded.message, bounded.status)

  try {
    const upstream = await (config.fetch ?? fetch)(config.endpoint, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${config.token}`,
        'content-type': 'application/json',
      },
      body: bounded.body,
      signal: AbortSignal.timeout(config.timeoutMs ?? 15_000),
    })
    const body = await upstream.text()
    const upstreamContentType = upstream.headers.get('content-type')
    return new Response(body || null, {
      status: upstream.status,
      ...(upstreamContentType
        ? { headers: { 'content-type': upstreamContentType } }
        : {}),
    })
  } catch {
    return jsonError('could not reach the feedback service', 502)
  }
}
