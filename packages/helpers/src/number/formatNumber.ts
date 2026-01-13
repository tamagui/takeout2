export interface FormatNumberOptions {
  locale?: string
  maximumFractionDigits?: number
  minimumFractionDigits?: number
  forceCompact?: boolean
}

export function formatNumber(value: number, options: FormatNumberOptions = {}): string {
  const {
    locale = 'en-US',
    maximumFractionDigits = 1,
    minimumFractionDigits = 0,
    forceCompact = false,
  } = options

  if (!forceCompact && Math.abs(value) < 1000) {
    return new Intl.NumberFormat(locale, {
      maximumFractionDigits,
      minimumFractionDigits,
    }).format(value)
  }

  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits,
    minimumFractionDigits,
  }).format(value)
}

export function abbreviateNumber(value: number): string {
  return formatNumber(value, { maximumFractionDigits: 1 })
}

export function formatCount(value: number): string {
  return formatNumber(value, {
    maximumFractionDigits: 0,
    forceCompact: value >= 1000,
  })
}

export function formatReactionCount(value: number | string): string {
  if (typeof value === 'string') return value
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toString()
}

export function formatPhoneNumber(value: string): string {
  return value
}
