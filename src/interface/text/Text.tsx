import { SizableText, styled, Text as TamaguiText } from 'tamagui'

export const Text = styled(SizableText, {
  name: 'Text',
})

export const Strong = styled(TamaguiText, {
  render: 'strong',
  fontWeight: '600',
})

export const Span = styled(TamaguiText, {
  render: 'span',
})

export const Em = styled(TamaguiText, {
  render: 'em',
  fontStyle: 'italic',
})

export const InlineLink = styled(TamaguiText, {
  render: 'span',
  color: '$blue11',
})
