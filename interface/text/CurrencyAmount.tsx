import { formatCents } from 'contrast-ui/display'
import { SizableText } from 'tamagui'
import type { ComponentProps } from 'react'

type CurrencyAmountProps = Omit<
  ComponentProps<typeof SizableText>,
  'adjustsFontSizeToFit' | 'children' | 'minimumFontScale' | 'numberOfLines'
> & {
  cents: number
  currency?: string
  locale?: string
}

export function CurrencyAmount({
  cents,
  currency = 'USD',
  locale,
  size = '6',
  ...textProps
}: CurrencyAmountProps) {
  const formattedAmount = formatCents(cents, currency, locale)

  return (
    <SizableText
      {...textProps}
      size={size}
      adjustsFontSizeToFit
      minimumFontScale={0.6}
      numberOfLines={1}
    >
      {formattedAmount}
    </SizableText>
  )
}
