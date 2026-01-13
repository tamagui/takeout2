// simple helper to ensure we always get a valid 6-digit hex color from a number
export function toHex(value: number): string {
  // ensure we get a 6-digit hex string with leading zeros if needed
  return '#' + value.toString(16).padStart(6, '0')
}

// generate a random hex color
export function randomHex(): string {
  return toHex(Math.floor(Math.random() * 0xffffff))
}
