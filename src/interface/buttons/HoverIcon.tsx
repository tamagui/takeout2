import { styled, YStack } from 'tamagui'

export const HoverHideIcon = styled(YStack, {
  animation: 'quick',
  opacity: 1,
  y: 0,
  fullscreen: true,
  items: 'center',
  justify: 'center',
  '$group-icon-hover': {
    y: 5,
    opacity: 0,
  },
})

export const HoverShowIcon = styled(YStack, {
  animation: 'quick',
  y: 5,
  opacity: 0,
  fullscreen: true,
  items: 'center',
  justify: 'center',

  '$group-icon-hover': {
    y: 0,
    opacity: 1,
  },
})
