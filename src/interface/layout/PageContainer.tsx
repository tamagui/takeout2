import { styled, YStack } from 'tamagui'

export const PageContainer = styled(YStack, {
  position: 'relative',
  mx: 'auto',
  px: '$4',
  width: '100%',
  minW: 340,

  $md: {
    maxW: 920,
  },

  $lg: {
    maxW: 1120,
  },

  $xl: {
    maxW: 1200,
  },
})

export const PageMainContainer = styled(PageContainer, {
  render: 'main',
  role: 'main',
})
