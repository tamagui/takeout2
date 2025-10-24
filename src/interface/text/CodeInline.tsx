import { styled, Text } from 'tamagui'

export const CodeInline = styled(Text, {
  fontFamily: '$mono',
  bg: '$color2',
  p: 3,
  my: -3,
  rounded: '$3',
  borderWidth: 0.5,
  borderColor: '$color4',

  '$platform-web': {
    fontSize: '80%',
    lineHeight: 'inherit',
  },
})
