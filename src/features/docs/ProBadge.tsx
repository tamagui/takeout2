import { SizableText, Theme, type ThemeName, XStack, type XStackProps } from 'tamagui'

import { Link } from '~/interface/app/Link'

type ProBadgeProps = {
  size?: 'small' | 'large'
  /** opt-in link wrapping, disabled by default to avoid nested <a> tags */
  link?: boolean
} & XStackProps

export const ProBadge = ({ size = 'small', link, ...props }: ProBadgeProps) => {
  const isLarge = size === 'large'

  const badge = (
    <XStack
      display="inline-flex"
      y={-2}
      mx={isLarge ? '$2' : 0}
      px="$2"
      py="$1"
      bg="$color4"
      rounded="$3"
      cursor={link ? 'pointer' : 'inherit'}
      hoverStyle={link ? { bg: '$color5' } : {}}
      pressStyle={link ? { bg: '$color6' } : {}}
      {...props}
    >
      <SizableText
        size={isLarge ? '$4' : '$3'}
        fontFamily="$mono"
        fontWeight="600"
        color="$color11"
      >
        Pro
      </SizableText>
    </XStack>
  )

  if (!link) {
    return <Theme name={'blue' as ThemeName}>{badge}</Theme>
  }

  return (
    <Theme name={'blue' as ThemeName}>
      <Link href="https://tamagui.dev/takeout" target="_blank" hideExternalIcon asChild>
        <XStack render="a">{badge}</XStack>
      </Link>
    </Theme>
  )
}
