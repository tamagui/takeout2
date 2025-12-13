import { styled, YStack } from 'tamagui'

export const PageContainer = styled(YStack, {
  mx: 'auto',
  px: '$4',
  width: '100%',
  position: 'relative',
  minW: 380,

  $md: {
    maxW: 760,
  },

  $lg: {
    maxW: 860,
  },

  $xl: {
    maxW: 1140,
  },
})
