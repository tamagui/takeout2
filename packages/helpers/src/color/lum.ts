// Helper to ensure color string is valid (simple fallback implementation)
const validColor = (color: string) => color

export function lum(color: string, luminance = 0.5): string {
  // handle hsl/hsla
  if (color.startsWith('hsl')) {
    const match = color.match(/hsla?\((\d+),\s*(\d+)%,\s*(\d+)%(?:,\s*([\d.]+))?\)/)
    if (match) {
      const [, h, s, , a] = match
      const newL = Math.round(luminance * 100)
      if (a) {
        return validColor(`hsla(${h}, ${s}%, ${newL}%, ${a})`)
      }
      return validColor(`hsl(${h}, ${s}%, ${newL}%)`)
    }
  }

  // handle hex - convert to hsl and adjust
  if (color.startsWith('#')) {
    let hex = color.slice(1)

    // expand shorthand hex
    if (hex.length === 3) {
      hex = hex
        .split('')
        .map((c) => c + c)
        .join('')
    }

    // convert hex to rgb
    const r = parseInt(hex.slice(0, 2), 16) / 255
    const g = parseInt(hex.slice(2, 4), 16) / 255
    const b = parseInt(hex.slice(4, 6), 16) / 255

    // convert rgb to hsl
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const l = (max + min) / 2

    if (max === min) {
      // achromatic
      const newL = Math.round(luminance * 100)
      return validColor(`hsl(0, 0%, ${newL}%)`)
    }

    const d = max - min
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    let h: number
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
      default:
        h = 0
    }

    const newH = Math.round(h * 360)
    const newS = Math.round(s * 100)
    const newL = Math.round(luminance * 100)

    // preserve alpha if present
    if (hex.length === 8) {
      const alpha = parseInt(hex.slice(6, 8), 16) / 255
      return validColor(`hsla(${newH}, ${newS}%, ${newL}%, ${alpha.toFixed(2)})`)
    }

    return validColor(`hsl(${newH}, ${newS}%, ${newL}%)`)
  }

  return validColor(color)
}
