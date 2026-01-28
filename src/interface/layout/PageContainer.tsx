import { styled, YStack } from 'tamagui'

export const PageContainer = styled(YStack, {
  position: 'relative',
  mx: 'auto',
  flex: 1,
  flexBasis: 'auto',
  px: '$4',
  width: '100%',
  minW: 340,

  $sm: {
    maxW: 760,
  },

  $md: {
    maxW: 960,
  },

  $lg: {
    maxW: 1140,
  },
})

export const PageMainContainer = styled(PageContainer, {
  render: 'main',
  role: 'main',
})
