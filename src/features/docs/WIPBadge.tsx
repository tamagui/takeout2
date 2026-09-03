import { SizableText, Theme, XStack } from 'tamagui'

type WIPBadgeProps = {
  size?: 'small' | 'large'
}

export const WIPBadge = ({ size = 'small' }: WIPBadgeProps) => {
  const isLarge = size === 'large'

  return (
    <Theme name="yellow">
      <XStack
        display="inline-flex"
        y={-2}
        mx={isLarge ? '2' : 0}
        px="2"
        py="1"
        bg="color4"
        rounded="3"
      >
        <SizableText
          size={isLarge ? '4' : '3'}
          fontFamily="mono"
          fontWeight="600"
          color="color11"
        >
          WIP
        </SizableText>
      </XStack>
    </Theme>
  )
}
