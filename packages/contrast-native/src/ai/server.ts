// app ai for server code in apps built on Contrast: decisions, text, and
// images through Contrast, billed to the developer's Contrast balance.
//
//   import { contrastAi } from 'contrast-native/ai/server'
//   const { answers } = await contrastAi.decide({ endUserId, state, questions })
//   const { text } = await contrastAi.text({ endUserId, prompt })
//   const { image } = await contrastAi.image({ endUserId, prompt })
//
// server-only: CONTRAST_AI_URL and CONTRAST_AI_TOKEN are secrets Contrast sets
// on the app's deployment. call these from +api routes or server mutations,
// never from code that ships to a device or a browser.
import type {
  AppAiErrorBody,
  AppAiErrorCode,
  DecideRequest,
  DecideResponse,
  ImageRequest,
  ImageResponse,
  TextRequest,
  TextResponse,
} from './contract'

export type * from './contract'

export class ContrastAiError extends Error {
  readonly code: AppAiErrorCode
  // set on rate_limited: how long until the same call can succeed
  readonly retryAfterMs: number | null
  constructor(code: AppAiErrorCode, message: string, retryAfterMs: number | null = null) {
    super(message)
    this.name = 'ContrastAiError'
    this.code = code
    this.retryAfterMs = retryAfterMs
  }
}

function errorBody(value: unknown): AppAiErrorBody['error'] | null {
  if (value === null || typeof value !== 'object' || !('error' in value)) return null
  const error = value.error
  if (error === null || typeof error !== 'object') return null
  const code = 'code' in error ? error.code : null
  const message = 'message' in error ? error.message : null
  const retryAfterMs = 'retryAfterMs' in error ? error.retryAfterMs : undefined
  if (typeof code !== 'string' || typeof message !== 'string') return null
  const known: AppAiErrorCode[] = [
    'unauthorized',
    'disabled',
    'invalid_request',
    'rate_limited',
    'unfunded',
    'unavailable',
  ]
  const typed = known.find((entry) => entry === code)
  if (!typed) return null
  return {
    code: typed,
    message,
    ...(typeof retryAfterMs === 'number' ? { retryAfterMs } : {}),
  }
}

async function call<Result>(path: string, body: object): Promise<Result> {
  const url = process.env.CONTRAST_AI_URL
  const token = process.env.CONTRAST_AI_TOKEN
  if (!url || !token) {
    throw new ContrastAiError(
      'disabled',
      'app ai is not configured: Contrast sets CONTRAST_AI_URL and CONTRAST_AI_TOKEN on deployments of apps with AI turned on',
    )
  }
  const response = await fetch(`${url.replace(/\/+$/, '')}/${path}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const parsed: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const error = errorBody(parsed)
    throw error
      ? new ContrastAiError(error.code, error.message, error.retryAfterMs ?? null)
      : new ContrastAiError('unavailable', `app ai answered ${response.status}`)
  }
  // contrast wrote this body against the same contract the request used
  return parsed as Result
}

export const contrastAi = {
  decide: (request: DecideRequest) => call<DecideResponse>('decide', request),
  text: (request: TextRequest) => call<TextResponse>('text', request),
  image: (request: ImageRequest) => call<ImageResponse>('image', request),
}
