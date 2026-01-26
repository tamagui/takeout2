import { Separator, SizableText, XStack, styled, type FontSizeTokens } from 'tamagui'

import type { ReactNode } from 'react'

export const H1 = styled(SizableText, {
  render: 'h1',
  role: 'heading',
  fontFamily: '$heading',
  size: '$10',
  fontWeight: '700',
})

export const H2 = styled(SizableText, {
  render: 'h2',
  role: 'heading',
  fontFamily: '$heading',
  size: '$9',
  fontWeight: '700',
})

export const H3 = styled(SizableText, {
  render: 'h3',
  role: 'heading',
  fontFamily: '$heading',
  size: '$8',
  fontWeight: '600',
})

export const H4 = styled(SizableText, {
  render: 'h4',
  role: 'heading',
  fontFamily: '$heading',
  size: '$6',
  fontWeight: '600',
})

export const H5 = styled(SizableText, {
  render: 'h5',
  role: 'heading',
  fontFamily: '$heading',
  size: '$5',
  fontWeight: '500',
})

export const H6 = styled(SizableText, {
  render: 'h6',
  role: 'heading',
  fontFamily: '$heading',
  size: '$4',
  fontWeight: '500',
})

export const SubHeading = styled(SizableText, {
  size: '$5',
  color: '$color10',
  fontWeight: '300',

  $lg: {
    size: '$6',
  },
})

export const SepHeading = ({
  children,
  size = '$4',
}: {
  children: ReactNode
  size?: FontSizeTokens
}) => {
  return (
    <XStack ml="$3" my="$4" items="center" gap="$6">
      <H3 size={size} color="$color10">
        {children}
      </H3>
      <Separator opacity={0.5} />
    </XStack>
  )
}
