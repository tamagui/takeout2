import { styled, Text, YStack } from 'tamagui'

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
  mr: -40,
  mt: -2,
  opacity: 0.85,
})

const BadgeText = styled(Text, {
  fontSize: 12,
  fontWeight: '500',
  letterSpacing: 0.8,
  color: '$color11',
  textTransform: 'lowercase',
  fontFamily: '$mono',
})

export const BetaBadge = () => {
  return (
    <BadgeContainer>
      <BadgeText>beta</BadgeText>
    </BadgeContainer>
  )
}
