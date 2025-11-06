import { styled, YStack } from 'tamagui'

export const PageContainer = styled(YStack, {
  mx: 'auto',
  px: '$4',
  width: '100%',
  flex: 1,
  position: 'relative',

  $md: {
    maxW: 760,
    pr: '$2',
  },

  $lg: {
    maxW: 760,
    pr: '$2',
  },

  $xl: {
    maxW: 840,
    pr: '$10',
  },
})
