import type { ColorTokens } from 'tamagui'

// type-only helper for asserting a string color is valid
export const validColor = (color?: string): ColorTokens => {
  return color as ColorTokens
}
