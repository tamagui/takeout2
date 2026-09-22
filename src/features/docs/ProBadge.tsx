import { html, SizableText, Theme, type XStackProps } from 'tamagui'

import { Link } from '~/interface/app/Link'

type ProBadgeProps = {
  size?: 'small' | 'large'
  /** opt-in link wrapping, disabled by default to avoid nested <a> tags */
  link?: boolean
  ml?: XStackProps['ml']
}

export const ProBadge = ({ size = 'small', link, ml }: ProBadgeProps) => {
  const isLarge = size === 'large'

  const badge = (
    <html.span
      display="inline-flex"
      y={-2}
      mx={isLarge ? '2' : '0'}
      px="2"
      py="1"
      bg={link ? 'color4 hover:color5 press:color6' : 'color4'}
      rounded="3"
      cursor={link ? 'pointer' : 'inherit'}
      ml={ml}
    >
      <SizableText
        size={isLarge ? '4' : '3'}
        fontFamily="mono"
        fontWeight="600"
        color="color11"
      >
        Pro
      </SizableText>
    </html.span>
  )

  if (!link) {
    return <Theme name="brand">{badge}</Theme>
  }

  return (
    <Theme name="brand">
      <Link href="https://tamagui.dev/takeout" target="_blank" hideExternalIcon asChild>
        <html.a>{badge}</html.a>
      </Link>
    </Theme>
  )
}
