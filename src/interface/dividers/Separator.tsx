import { Separator as TamaguiSeparator, styled } from 'tamagui'

export const Separator = styled(TamaguiSeparator, {
  borderColor: '$color3',
  borderWidth: 0.5,
  opacity: 0.8,

  '$platform-web': {
    borderColor: '$color4',
    opacity: 0.3,
  },
})
