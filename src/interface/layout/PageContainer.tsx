import { html, styled } from 'tamagui'

export const PageContainer = styled(html.div, {
  position: 'relative',
  mx: 'auto',
  px: '4',
  w: '100%',
  minW: 340,
  maxW: 'md:920px lg:1120px xl:1200px',
})

export const PageMainContainer = styled(html.main, {
  position: 'relative',
  mx: 'auto',
  px: '4',
  w: '100%',
  minW: 340,
  maxW: 'md:920px lg:1120px xl:1200px',
})
