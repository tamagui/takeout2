import { styled, Text, Theme, YStack, type YStackProps } from 'tamagui'

const BadgeContainer = styled(YStack, {
  render: 'span',
  rotate: '8deg',
  px: '$1.5',
  py: 2,
  bg: '$color3',
  rounded: '$3',
  borderWidth: 0.5,
  borderColor: '$color6',
})

const BadgeText = styled(Text, {
  fontSize: 13,
  lineHeight: 19,
  fontWeight: '700',
  letterSpacing: -0,
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
