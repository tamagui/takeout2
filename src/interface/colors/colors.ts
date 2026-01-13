import { generateColors, lum } from '@take-out/helpers'

// normalize all colors to 6-digit hex
export const colors = [
  '#999999', // expanded from #999
  '#777777', // expanded from #777
  '#555555', // expanded from #555
  '#000000',
  '#ffffff',
  ...generateColors(),
]

export const darkColors = colors.map((color) => lum(color, 0.3))
export const lightColors = colors.map((color) => lum(color, 0.7))

export const getDarkLightColor = (index: number): [string, string] => {
  const i = index % colors.length
  return [darkColors[i]!, lightColors[i]!]
}
