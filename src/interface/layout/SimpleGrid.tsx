import { XStack, YStack, styled, type YStackProps } from 'tamagui'

export const SimpleGrid = styled(XStack, {
  flexWrap: 'wrap',
  gap: '3',
})

export const SimpleGridItem = styled(YStack, {
  variants: {
    columns: {
      1: {
        w: '100%',
      },
      2: {
        w: '100% sm:calc(50% - 8px)',
      },
      3: {
        w: '100% sm:calc(50% - 8px) lg:calc(33.33% - 8px)',
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
