import type { ModelName } from 'start/models'

export type LLMFunction = (params: {
  prompt: string
  model?: ModelName
  maxOutputTokens?: number
}) => Promise<string>

export const llm: LLMFunction = async ({
  prompt,
  model = 'or-kimi-k2',
  maxOutputTokens = 1024,
}) => {
  if (process.env.IS_TESTING) {
    throw new Error(`❌ DONT USE LLM IN TEST MODE!`)
  }

  // importing these modules on native will cause runtime errors
  // such as `ReferenceError: Property 'TransformStream' doesn't exist`
  // as a workaround, we need to dynamically import them when needed
  const { generateText } = await import('ai')
  const { models } = await import('start/models')

  const { text } = await generateText({
    model: models[model](),
    maxOutputTokens,
    prompt,
  })

  return text
}

export async function summarize(
  content: string,
  model: ModelName = 'or-kimi-k2'
): Promise<string> {
  if (process.env.IS_TESTING) {
    return `testing-category`
  }

  const text = await llm({
    model,
    maxOutputTokens: 512,
    prompt: `Summarize into as short a title as possible, < 5 words, no period, no punctionation, no formatting no emoji, if you can get it to 2-3 words instead of 5 without losing a lot of meaning, do that: ${content}`,
  })

  console.info(`Got summary: ${text}`)
  return text
}

export const aiActions = {
  llm,
  summarize,
}
