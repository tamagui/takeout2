import { XStack, YStack, styled, type SpaceTokens, type YStackProps } from 'tamagui'

import type { ReactNode } from 'react'

interface SimpleGridProps {
  children: ReactNode
  gap?: SpaceTokens
}

export const SimpleGrid = ({ children, gap = '$3' }: SimpleGridProps) => {
  return (
    <XStack flexWrap="wrap" columnGap={gap} rowGap={gap}>
      {children}
    </XStack>
  )
}

export const SimpleGridItem = styled(YStack, {
  variants: {
    columns: {
      1: {
        width: '100%',
      },
      2: {
        width: '100%',
        $sm: { width: 'calc(50% - 8px)' },
      },
      3: {
        width: '100%',
        $sm: { width: 'calc(50% - 8px)' },
        $lg: { width: 'calc(33.33% - 8px)' },
      },
    },
  } as const,

  defaultVariants: {
    columns: 3,
  },
})

export type SimpleGridItemProps = YStackProps & {
  columns?: 1 | 2 | 3
}
