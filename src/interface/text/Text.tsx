import { SizableText, styled, Text as TamaguiText } from 'tamagui'

export const Text = styled(SizableText, {
  name: 'Text',
})

export const Strong = styled(TamaguiText, {
  name: 'Strong',
  render: 'strong',
  fontWeight: '600',
})

export const Em = styled(TamaguiText, {
  name: 'Em',
  render: 'em',
  fontStyle: 'italic',
})

export const InlineLink = styled(TamaguiText, {
  name: 'InlineLink',
  render: 'span',
  color: '$blue11',
})
