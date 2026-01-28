import { styled, Text, Theme, YStack } from 'tamagui'

const BadgeContainer = styled(YStack, {
  position: 'relative',
  rotate: '8deg',
  px: '$1.5',
  py: 2,
  bg: '$color3',
  rounded: '$2',
  borderWidth: 0.5,
  borderColor: '$color6',
  ml: '$2',
  mr: -42,
  mt: -2,
  opacity: 0.85,
})

const BadgeText = styled(Text, {
  fontSize: 13,
  fontWeight: '800',
  letterSpacing: -0.25,
  color: '$color11',
  textTransform: 'lowercase',
  fontFamily: '$mono',
})

export const BetaBadge = () => {
  return (
    <Theme name="pink">
      <BadgeContainer>
        <BadgeText>beta</BadgeText>
      </BadgeContainer>
    </Theme>
  )
}
