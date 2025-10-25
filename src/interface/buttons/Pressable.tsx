import { styled, View } from 'tamagui'

export const Pressable = styled(View, {
  hitSlop: 10,
  pressStyle: {
    opacity: 0.5,
  },
})
