// simple reversible encoding - alphanumeric only

export function hashString(str: string): string {
  // convert to hex (0-9a-f)
  return str
    .split('')
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('')
}

export function unhashString(encoded: string): string {
  // convert from hex back to string
  return (
    encoded
      .match(/.{2}/g)
      ?.map((h) => String.fromCharCode(parseInt(h, 16)))
      .join('') || ''
  )
}
