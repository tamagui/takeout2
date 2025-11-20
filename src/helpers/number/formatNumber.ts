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
  // tmp commented out for testing phone numbers in different countries

  // // Remove all non-digit characters
  // const cleaned = value.replace(/\D/g, '')

  // // Format as (XXX) XXX-XXXX
  // if (cleaned.length <= 3) {
  //   return cleaned
  // } else if (cleaned.length <= 6) {
  //   return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`
  // } else if (cleaned.length <= 10) {
  //   return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  // } else {
  //   // Limit to 10 digits for US phone numbers
  //   return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`
  // }
}
