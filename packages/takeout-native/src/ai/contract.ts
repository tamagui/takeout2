// the wire contract between an app's server code and an app ai service's
// endpoints (/api/app-ai/decide, /text, /image). the app sends plain json
// with its deployment's bearer token; the service validates every field again,
// since the body comes from code it did not write.

// decisions: the app describes its state and asks typed questions, and gets
// calibrated answers back. `noul` is a yes/no probability, `choice` picks one
// of the named options, `score` places the answer on an ordered scale.
export type DecisionState = string | Record<string, unknown> | Array<unknown>

export type DecisionNoulQuestion = {
  type: 'noul'
  instructions: string
  criteria?: Record<string, string>
}

export type DecisionChoiceQuestion = {
  type: 'choice'
  instructions: string
  criteria: Record<string, string>
}

export type DecisionScoreQuestion = {
  type: 'score'
  instructions: string
  criteria: Array<string>
}

export type DecisionQuestion =
  | DecisionNoulQuestion
  | DecisionChoiceQuestion
  | DecisionScoreQuestion

export type DecisionQuestions = Record<string, DecisionQuestion>

export type DecisionNoulAnswer = { type: 'noul'; noul: number }

export type DecisionChoiceAnswer = {
  type: 'choice'
  choice: string
  confidence: number
  probabilities: Record<string, number>
}

export type DecisionScoreAnswer = {
  type: 'score'
  score: number
  confidence: number
  legend: Record<string, string>
  probabilities: Record<string, number>
}

export type DecisionAnswer =
  | DecisionNoulAnswer
  | DecisionChoiceAnswer
  | DecisionScoreAnswer

export type DecisionAnswers = Record<string, DecisionAnswer>

// the app's own id for the person using it, so one person cannot spend the
// whole app's allowance. omit it only for calls no signed-in person makes;
// those share one small allowance per app.
type EndUser = { endUserId?: string }

export type DecideRequest = EndUser & {
  state: DecisionState
  questions: DecisionQuestions
}

export type TextRequest = EndUser & {
  prompt: string
  system?: string
  maxOutputTokens?: number
}

export const IMAGE_ASPECT_RATIOS = ['square', 'portrait', 'landscape'] as const
export type ImageAspectRatio = (typeof IMAGE_ASPECT_RATIOS)[number]

export type ImageRequest = EndUser & {
  prompt: string
  aspectRatio?: ImageAspectRatio
}

// every answer names the model that served it and what the call cost the
// developer's balance
type Served = { model: string; costUsd: number }

export type DecideResponse = Served & { answers: DecisionAnswers }
export type TextResponse = Served & { text: string }
export type ImageResponse = Served & { image: { base64: string; mediaType: string } }

export type AppAiErrorCode =
  | 'unauthorized'
  | 'disabled'
  | 'invalid_request'
  | 'rate_limited'
  | 'unfunded'
  | 'unavailable'

export type AppAiErrorBody = {
  error: { code: AppAiErrorCode; message: string; retryAfterMs?: number }
}

export const APP_AI_LIMITS = {
  endUserIdChars: 200,
  stateBytes: 32_000,
  questions: 16,
  questionTextChars: 2_000,
  criteria: 16,
  promptChars: 32_000,
  systemChars: 16_000,
  maxOutputTokens: 4_096,
  defaultOutputTokens: 1_024,
  imagePromptChars: 4_000,
} as const

type Parsed<T> = { ok: true; value: T } | { ok: false; message: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function boundedString(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max
}

// question names and criteria keys become object keys on both sides of the
// wire; `__proto__` is refused since json parsers drop or reinterpret it
function isName(value: string): boolean {
  return boundedString(value, 100) && value !== '__proto__'
}

function parseEndUserId(body: Record<string, unknown>): Parsed<string | undefined> {
  const value = body.endUserId
  if (value === undefined) return { ok: true, value: undefined }
  return boundedString(value, APP_AI_LIMITS.endUserIdChars)
    ? { ok: true, value }
    : {
        ok: false,
        message: `endUserId must be a string up to ${APP_AI_LIMITS.endUserIdChars} characters`,
      }
}

function parseCriteriaRecord(value: unknown): Record<string, string> | null {
  if (!isRecord(value)) return null
  const entries = Object.entries(value)
  if (entries.length === 0 || entries.length > APP_AI_LIMITS.criteria) return null
  const criteria: Array<[string, string]> = []
  for (const [key, text] of entries) {
    if (!isName(key) || !boundedString(text, APP_AI_LIMITS.questionTextChars)) return null
    criteria.push([key, text])
  }
  return Object.fromEntries(criteria)
}

function parseQuestion(value: unknown): DecisionQuestion | null {
  if (!isRecord(value)) return null
  const { type, instructions, criteria } = value
  if (!boundedString(instructions, APP_AI_LIMITS.questionTextChars)) return null
  if (type === 'noul') {
    if (criteria === undefined) return { type, instructions }
    const parsed = parseCriteriaRecord(criteria)
    return parsed ? { type, instructions, criteria: parsed } : null
  }
  if (type === 'choice') {
    const parsed = parseCriteriaRecord(criteria)
    return parsed && Object.keys(parsed).length >= 2
      ? { type, instructions, criteria: parsed }
      : null
  }
  if (type === 'score') {
    if (
      !Array.isArray(criteria) ||
      criteria.length < 2 ||
      criteria.length > APP_AI_LIMITS.criteria
    ) {
      return null
    }
    const levels: string[] = []
    for (const level of criteria) {
      if (!boundedString(level, APP_AI_LIMITS.questionTextChars)) return null
      levels.push(level)
    }
    return { type, instructions, criteria: levels }
  }
  return null
}

export function parseDecideRequest(value: unknown): Parsed<DecideRequest> {
  if (!isRecord(value)) return { ok: false, message: 'the body must be a json object' }
  const endUserId = parseEndUserId(value)
  if (!endUserId.ok) return endUserId
  const state = value.state
  if (typeof state !== 'string' && !isRecord(state) && !Array.isArray(state)) {
    return { ok: false, message: 'state must be a string, an object, or an array' }
  }
  if (
    new TextEncoder().encode(JSON.stringify(state)).byteLength > APP_AI_LIMITS.stateBytes
  ) {
    return {
      ok: false,
      message: `state must serialize to at most ${APP_AI_LIMITS.stateBytes} bytes`,
    }
  }
  if (!isRecord(value.questions))
    return { ok: false, message: 'questions must be an object' }
  const entries = Object.entries(value.questions)
  if (entries.length === 0 || entries.length > APP_AI_LIMITS.questions) {
    return {
      ok: false,
      message: `ask between 1 and ${APP_AI_LIMITS.questions} questions`,
    }
  }
  const questions: Array<[string, DecisionQuestion]> = []
  for (const [name, raw] of entries) {
    const question = parseQuestion(raw)
    if (!isName(name) || !question) {
      return {
        ok: false,
        message: `question "${name.slice(0, 100)}" is malformed: names are 1 to 100 characters and not __proto__, noul takes optional criteria, choice at least two named criteria, score at least two ordered levels`,
      }
    }
    questions.push([name, question])
  }
  return {
    ok: true,
    value: {
      endUserId: endUserId.value,
      state,
      questions: Object.fromEntries(questions),
    },
  }
}

export function parseTextRequest(value: unknown): Parsed<TextRequest> {
  if (!isRecord(value)) return { ok: false, message: 'the body must be a json object' }
  const endUserId = parseEndUserId(value)
  if (!endUserId.ok) return endUserId
  if (!boundedString(value.prompt, APP_AI_LIMITS.promptChars)) {
    return {
      ok: false,
      message: `prompt must be a string up to ${APP_AI_LIMITS.promptChars} characters`,
    }
  }
  if (
    value.system !== undefined &&
    !boundedString(value.system, APP_AI_LIMITS.systemChars)
  ) {
    return {
      ok: false,
      message: `system must be a string up to ${APP_AI_LIMITS.systemChars} characters`,
    }
  }
  const maxOutputTokens = value.maxOutputTokens ?? APP_AI_LIMITS.defaultOutputTokens
  if (
    typeof maxOutputTokens !== 'number' ||
    !Number.isInteger(maxOutputTokens) ||
    maxOutputTokens < 1 ||
    maxOutputTokens > APP_AI_LIMITS.maxOutputTokens
  ) {
    return {
      ok: false,
      message: `maxOutputTokens must be an integer from 1 to ${APP_AI_LIMITS.maxOutputTokens}`,
    }
  }
  return {
    ok: true,
    value: {
      endUserId: endUserId.value,
      prompt: value.prompt,
      ...(value.system === undefined ? {} : { system: value.system }),
      maxOutputTokens,
    },
  }
}

export function parseImageRequest(value: unknown): Parsed<ImageRequest> {
  if (!isRecord(value)) return { ok: false, message: 'the body must be a json object' }
  const endUserId = parseEndUserId(value)
  if (!endUserId.ok) return endUserId
  if (!boundedString(value.prompt, APP_AI_LIMITS.imagePromptChars)) {
    return {
      ok: false,
      message: `prompt must be a string up to ${APP_AI_LIMITS.imagePromptChars} characters`,
    }
  }
  const aspectRatio = IMAGE_ASPECT_RATIOS.find(
    (ratio) => ratio === (value.aspectRatio ?? 'square'),
  )
  if (!aspectRatio) {
    return {
      ok: false,
      message: `aspectRatio must be one of ${IMAGE_ASPECT_RATIOS.join(', ')}`,
    }
  }
  return {
    ok: true,
    value: { endUserId: endUserId.value, prompt: value.prompt, aspectRatio },
  }
}
