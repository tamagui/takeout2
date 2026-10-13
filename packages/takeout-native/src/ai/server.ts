// app ai for server code: decisions, text, and images through an app ai
// endpoint that speaks the contract in ./contract.
//
//   import { appAi } from 'takeout-native/ai/server'
//   const { answers } = await appAi.decide({ endUserId, state, questions })
//   const { text } = await appAi.text({ endUserId, prompt })
//   const { image } = await appAi.image({ endUserId, prompt })
//
// server-only: APP_AI_URL and APP_AI_TOKEN are secrets set on the
// app's deployment. call these from +api routes or server mutations,
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

export class AppAiError extends Error {
  readonly code: AppAiErrorCode
  // set on rate_limited: how long until the same call can succeed
  readonly retryAfterMs: number | null
  constructor(code: AppAiErrorCode, message: string, retryAfterMs: number | null = null) {
    super(message)
    this.name = 'AppAiError'
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
  const url = process.env.APP_AI_URL
  const token = process.env.APP_AI_TOKEN
  if (!url || !token) {
    throw new AppAiError(
      'disabled',
      'app ai is not configured: set APP_AI_URL and APP_AI_TOKEN on the deployment',
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
      ? new AppAiError(error.code, error.message, error.retryAfterMs ?? null)
      : new AppAiError('unavailable', `app ai answered ${response.status}`)
  }
  // the endpoint wrote this body against the same contract the request used
  return parsed as Result
}

export const appAi = {
  decide: (request: DecideRequest) => call<DecideResponse>('decide', request),
  text: (request: TextRequest) => call<TextResponse>('text', request),
  image: (request: ImageRequest) => call<ImageResponse>('image', request),
}
