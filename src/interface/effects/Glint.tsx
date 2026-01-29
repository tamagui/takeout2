import { isNative } from '@take-out/helpers'
import { styled, YStack } from 'tamagui'

const Glint = styled(YStack, {
  fullscreen: true,
  pointerEvents: 'none',
  borderTopWidth: 0.5,
  borderColor: '$white',
  // Workaround for native
  ...(isNative && {
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  }),

  z: 10,

  '$theme-dark': {
    opacity: 0.1,
  },

  '$theme-light': {
    opacity: 0.8,
  },

  variants: {
    bottomShadow: {
      true: {
        // safari bugs if you have different color bottom border so just use shadow
        '$theme-dark': {
          shadowRadius: 2,
          shadowOffset: { height: 2, width: 0 },
          shadowColor: '$shadow4',
        },

        '$theme-light': {
          shadowRadius: 4,
          shadowOffset: { height: 2, width: 0 },
          shadowColor: '$shadow2',
        },
      },
    },
  } as const,
})

export default Glint
