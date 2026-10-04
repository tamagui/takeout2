import { styled, YStack } from 'tamagui'

export const Glint = styled(YStack, {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  borderTopWidth: 0.5,
  borderTopColor: 'highlight1',
  borderLeftColor: 'transparent',
  borderRightColor: 'transparent',
  borderBottomColor: 'transparent',
  // Workaround for native
  borderLeftWidth: 'native:0.5px',
  borderRightWidth: 'native:0.5px',
  z: 100_000_000,
  opacity: 'dark:0.5 light:0.8',
  variants: {
    bottomShadow: {
      true: {
        // safari bugs if you have different color bottom border so just use shadow
        boxShadow: 'dark:0 0.5px 0.5px 1px shadow4 light:0 0.5px 2px shadow3',
      },
    },
  } as const,
})
