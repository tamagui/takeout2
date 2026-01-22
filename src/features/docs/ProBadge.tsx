import { SizableText, Theme, type ThemeName, XStack, type XStackProps } from 'tamagui'

import { Link } from '~/interface/app/Link'

type ProBadgeProps = {
  size?: 'small' | 'large'
} & XStackProps

export const ProBadge = ({ size = 'small', ...props }: ProBadgeProps) => {
  const isLarge = size === 'large'

  return (
    <Theme name={'blue' as ThemeName}>
      <Link href="https://tamagui.dev/takeout" target="_blank" hideExternalIcon asChild>
        <XStack
          render="a"
          display="inline-flex"
          y={-2}
          mx={isLarge ? '$2' : 0}
          px="$2"
          py="$1"
          bg="$color4"
          rounded="$3"
          cursor="pointer"
          hoverStyle={{ bg: '$color5' }}
          pressStyle={{ bg: '$color6' }}
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
      </Link>
    </Theme>
  )
}
