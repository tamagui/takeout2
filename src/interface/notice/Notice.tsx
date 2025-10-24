import { styled, YStack } from 'tamagui'

export const Notice = styled(YStack, {
  gap: '$4',
  p: '$5',
  rounded: '$8',
  borderWidth: 0.5,
  borderColor: '$color3',
  maxW: 600,
  self: 'center',
  mx: '$8',
  my: '$4',
  shadowColor: '$shadow3',
  shadowOffset: { height: 4, width: 0 },
  shadowRadius: 20,
})
