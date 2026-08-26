import { html, Separator, styled, XStack, type FontSizeTokens } from 'tamagui'

import type { ReactNode } from 'react'

export const H1 = styled(html.h1, {
  fontFamily: 'heading',
  fontWeight: '800',
  fontSize: '10',
  lineHeight: '10',
})

export const H2 = styled(html.h2, {
  fontFamily: 'heading',
  fontWeight: '700',
  fontSize: '9',
  lineHeight: '9',
})

export const H3 = styled(html.h3, {
  fontFamily: 'heading',
  fontWeight: '600',
  fontSize: '8',
  lineHeight: '8',
})

export const H4 = styled(html.h4, {
  fontFamily: 'heading',
  fontWeight: '600',
  fontSize: '6',
  lineHeight: '6',
})

export const H5 = styled(html.h5, {
  fontFamily: 'heading',
  fontWeight: '500',
  fontSize: '5',
  lineHeight: '5',
})

export const H6 = styled(html.h6, {
  fontFamily: 'heading',
  fontWeight: '500',
  fontSize: '4',
  lineHeight: '4',
})

export const SubHeading = styled(html.p, {
  fontSize: '5 lg:6',
  color: 'color10',
  fontWeight: '300',
})

export const SepHeading = ({
  children,
  size = '4',
}: {
  children: ReactNode
  size?: FontSizeTokens
}) => {
  return (
    <XStack ml="3" my="4" items="center" gap="6">
      <H3 fontSize={size} color="color10">
        {children}
      </H3>
      <Separator opacity={0.5} />
    </XStack>
  )
}
