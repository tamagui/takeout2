import { authState } from './authClient'

export async function fetchStream(
  url: string,
  {
    fetchLibrary = fetch,
    onPartial,
    ...init
  }: RequestInit & {
    onPartial?: (chunk: string) => void
    fetchLibrary?: typeof fetch
  } = {}
) {
  // Add auth header if session token is available
  const sessionToken = authState.value?.session?.token
  const headers = new Headers(init.headers)

  if (sessionToken) {
    headers.set('Authorization', `Bearer ${sessionToken}`)
  }

  const response = await fetchLibrary(url, {
    ...init,
    headers,
  })
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  if (!response.body) {
    throw new Error(`No body`)
  }

  // Get a reader from the response body
  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  let result = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    if (init.signal?.aborted) {
      break
    }
    if (value) {
      // Decode the current chunk and process it (e.g., append to UI)
      const chunk = decoder.decode(value, { stream: true })
      result += chunk
      onPartial?.(chunk)
    }
  }

  const finalChunk = decoder.decode()
  if (finalChunk) {
    result += finalChunk
    onPartial?.(finalChunk)
  }

  return result
}
