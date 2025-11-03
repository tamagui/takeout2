export function getHeaders(headers: Headers): Record<string, unknown> {
  const headersOut: Record<string, unknown> = {}
  headers.forEach((value, key) => {
    headersOut[key] = value
  })
  return headersOut
}
