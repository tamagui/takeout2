import { styled, YStack } from 'tamagui'

export const PageContainer = styled(YStack, {
  mx: 'auto',
  px: '$4',
  width: '100%',
  position: 'relative',
  flex: 1,

  $md: {
    maxW: 760,
  },

  $lg: {
    maxW: 760,
  },

  $xl: {
    maxW: 1200,
  },
})
