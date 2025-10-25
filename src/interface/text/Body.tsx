import { SizableText, styled } from 'tamagui'

export const MediumText = styled(SizableText, {
  fontFamily: '$body',
  fontSize: 16,
  color: '$color11',
  fontWeight: '500',
})

export const BodyText = styled(SizableText, {
  fontFamily: '$body',
  fontSize: 14,
  color: '$color11',
  fontWeight: '500',
})

export const SmallText = styled(SizableText, {
  fontFamily: '$body',
  fontSize: 13,
  color: '$color10',
  fontWeight: '500',
})

export const TinyText = styled(SizableText, {
  fontFamily: '$body',
  fontSize: 12,
  color: '$color10',
  fontWeight: '500',
  lineHeight: 16,
})
