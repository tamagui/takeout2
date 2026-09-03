import { styled, YStack } from 'tamagui'

export const Glint = styled(YStack, {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  borderTopWidth: 0.5,
  borderTopColor: 'var(--button-glint-border)',
  borderLeftColor: 'transparent',
  borderRightColor: 'transparent',
  borderBottomColor: 'transparent',
  // Workaround for native
  borderLeftWidth: 'native:0.5px',
  borderRightWidth: 'native:0.5px',
  z: 100_000_000,
  opacity: 'var(--button-glint-opacity)',
  variants: {
    bottomShadow: {
      true: {
        // safari bugs if you have different color bottom border so just use shadow
        boxShadow: 'var(--button-glint-shadow)',
      },
    },
  } as const,
})
