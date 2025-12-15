import { Input as TamaguiInput, styled } from 'tamagui'

import { ListItemContext } from './ListItemContext'

export const ListItemInput = styled(TamaguiInput, {
  context: ListItemContext,
  borderWidth: 0,
  rounded: 0,
  bg: 'transparent',
  color: '$color12',
  flex: 1,
  py: 0,
  px: 0,
  height: 'auto',
  focusVisibleStyle: {
    outlineWidth: 2,
    outlineColor: '$color8',
    outlineStyle: 'solid',
  },

  variants: {
    size: {
      small: {
        fontSize: '$3',
        lineHeight: '$3',
      },
      medium: {
        fontSize: '$4',
        lineHeight: '$4',
      },
      large: {
        fontSize: '$5',
        lineHeight: '$5',
      },
    },

    bold: {
      true: {
        fontWeight: '900',
        color: '$color12',
      },
    },
  } as const,

  defaultVariants: {
    size: 'medium',
  },
})
