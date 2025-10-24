import { toHex } from './toHex'

type ColorGenOptions = {
  numColors?: number
  minSaturation?: number
  maxSaturation?: number
  minLightness?: number
  maxLightness?: number
}

// convert HSL to hex
function hslToHex(h: number, s: number, l: number): string {
  // normalize values
  h = h / 360
  s = s / 100
  l = l / 100

  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h * 12) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color)
  }

  const r = f(0)
  const g = f(8)
  const b = f(4)

  return toHex((r << 16) | (g << 8) | b)
}

export const generateColors = ({
  numColors = 32,
  minSaturation = 45,
  maxSaturation = 85,
  minLightness = 45,
  maxLightness = 65,
}: ColorGenOptions = {}): string[] => {
  const colors: string[] = []

  // Define hue ranges for color groups
  const hueRanges = [
    [0, 30], // reds
    [30, 60], // oranges
    [60, 90], // yellows
    [90, 150], // greens
    [150, 180], // teals
    [180, 240], // blues
    [240, 270], // purples
    [270, 330], // magentas
    [330, 360], // pink-reds
  ]

  // Calculate colors per group
  const colorsPerGroup = Math.ceil(numColors / hueRanges.length)

  hueRanges.forEach(([start, end]) => {
    const hueStep = (end! - start!) / colorsPerGroup

    for (let i = 0; i < colorsPerGroup; i++) {
      if (colors.length >= numColors) break

      const hue = start! + hueStep * i
      const saturation = minSaturation + Math.random() * (maxSaturation - minSaturation)
      const lightness = minLightness + Math.random() * (maxLightness - minLightness)

      colors.push(hslToHex(hue, saturation, lightness))
    }
  })

  return colors
}
