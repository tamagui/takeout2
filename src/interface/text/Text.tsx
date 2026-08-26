import { html, SizableText, styled } from 'tamagui'

export const Text = styled(SizableText, {
  name: 'Text',
})

export const Strong = styled(html.strong, {
  fontWeight: '600',
})

export const Span = styled(html.span, {})

export const Em = styled(html.em, {
  fontStyle: 'italic',
})

export const InlineLink = styled(html.span, {
  color: 'accent11',
})
