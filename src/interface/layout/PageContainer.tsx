import { styled, YStack } from 'tamagui'

export const PageContainer = styled(YStack, {
  position: 'relative',
  mx: 'auto',
  px: '4',
  width: '100%',
  minW: 340,
  maxW: 'md:920px lg:1120px xl:1200px',
})

export const PageMainContainer = styled(PageContainer, {
  render: 'main',
  role: 'main',
})
