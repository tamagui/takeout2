import { styled, Text, Theme, YStack, type YStackProps } from 'tamagui'

const BadgeContainer = styled(YStack, {
  tag: 'span',
  rotate: '8deg',
  px: '$1.5',
  py: 2,
  bg: '$color3',
  rounded: '$2',
  borderWidth: 0.5,
  borderColor: '$color6',
})

const BadgeText = styled(Text, {
  fontSize: 13,
  lineHeight: 22,
  fontWeight: '800',
  letterSpacing: -0.25,
  color: '$color11',
  textTransform: 'lowercase',
  fontFamily: '$mono',
})

export const BetaBadge = (props: YStackProps) => {
  return (
    <BadgeContainer theme="pink" {...props}>
      <BadgeText>beta</BadgeText>
    </BadgeContainer>
  )
}
