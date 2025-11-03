import { AbortError } from '../error/errors'

export const sleep = async (ms: number, signal?: AbortSignal): Promise<void> => {
  await new Promise((res) => setTimeout(res, ms))
  if (signal?.aborted) {
    throw new AbortError()
  }
}
