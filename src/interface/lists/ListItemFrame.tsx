import { styled, XStack } from 'tamagui'

import { ListItemContext } from './ListItemContext'

export const ListItemFrame = styled(XStack, {
  context: ListItemContext,
  group: 'item',
  containerType: 'normal',
  position: 'relative',
  items: 'center',
  gap: '2-5',
  minW: '100%',
  maxW: '100%',
  cursor: 'default',
  bg: 'press:color3',
  rounded: '4',
  // without this z-index of ListItemBackground -1 will appear sometimes below
  z: 0,
  outlineWidth: 'focus-visible:2px',
  outlineColor: 'focus-visible:color02',
  outlineOffset: 'focus-visible:1px',
  outlineStyle: 'focus-visible:solid',
  tabIndex: 0,
  variants: {
    variant: {
      default: {
        px: '2-5',
        py: 7,
      },
      compact: {
        py: '2',
      },
    },

    editable: {
      true: {},
    },

    onEditCancel: {
      true: {},
    },

    onEditComplete: {
      true: {},
    },

    editingValue: {
      true: {},
    },

    size: {
      small: {
        height: 34,
        gap: '2-5',
        px: '2-5',
      },
      medium: {
        height: 40,
        gap: '3',
        px: '3',
      },
      large: {
        height: 44,
        gap: '3-5',
        px: '3-5',
      },
    },

    active: {
      true: {
        // bg: 'color3',
      },
      accent: {
        // bg: 'accent3',
      },
      strong: {
        // bg: 'accent4',
      },
    },
  } as const,
  defaultVariants: {
    variant: 'default',
    size: 'medium',
  },
})
