import { SizableText, styled, Text as TamaguiText } from 'tamagui'

export const Text = styled(SizableText, {
  name: 'Text',
})

export const Strong = styled(TamaguiText, {
  name: 'Strong',
  tag: 'strong',
  fontWeight: '600',
})

export const Em = styled(TamaguiText, {
  name: 'Em',
  tag: 'em',
  fontStyle: 'italic',
})

export const InlineLink = styled(TamaguiText, {
  name: 'InlineLink',
  tag: 'span',
  color: '$blue11',
})
