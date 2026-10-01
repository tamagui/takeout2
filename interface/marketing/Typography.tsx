import { styled, Text as TamaguiText } from 'tamagui'

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
  color: '#3b82f6',
  cursor: 'pointer',
})

export const HighlightText = styled(TamaguiText, {
  render: 'span',
  backgroundImage: 'linear-gradient(90deg, var(--red-10) 0%, var(--orange-11) 100%)',
  color: 'transparent',
  style: {
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
  },
})

export const GradientText = styled(TamaguiText, {
  fontWeight: '800',
  render: 'span',
  backgroundImage: 'linear-gradient(90deg, var(--red-10) 0%, var(--orange-11) 100%)',
  color: 'transparent',
  style: {
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
  },
})
