import { styled, YStack } from 'tamagui'

export const Glint = styled(YStack, {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',

  borderTopWidth: 0.5,
  borderTopColor: '$highlight1',
  borderLeftColor: 'transparent',
  borderRightColor: 'transparent',
  borderBottomColor: 'transparent',

  // Workaround for native
  '$platform-native': {
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
  },

  z: 100_000_000,

  '$theme-dark': {
    opacity: 0.5,
  },

  '$theme-light': {
    opacity: 0.8,
  },

  variants: {
    bottomShadow: {
      true: {
        // safari bugs if you have different color bottom border so just use shadow
        '$theme-dark': {
          boxShadow: '0 0.5px 0.5px 1px $shadow4',
        },

        '$theme-light': {
          boxShadow: '0 0.5px 2px $shadow3',
        },
      },
    },
  } as const,
})
