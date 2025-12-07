import { styled, Text, withStaticProperties } from 'tamagui'

import { ListItemContext } from './ListItemContext'
import { ListItemFrame } from './ListItemFrame'
import { ListItemIcon } from './ListItemIcon'

const ListTitleText = styled(Text, {
  context: ListItemContext,
  fontFamily: '$mono',
  textTransform: 'uppercase',
  opacity: 0.225,
  select: 'none',
  pointerEvents: 'none',

  variants: {
    size: {
      small: {
        fontSize: '$2',
        lineHeight: '$2',
      },

      medium: {
        fontSize: '$3',
        lineHeight: '$3',
      },

      large: {
        fontSize: '$4',
        lineHeight: '$4',
      },
    },
  } as const,
})

const ListTitleComponent = styled(ListItemFrame, {
  items: 'center',
  mt: -12,
  mb: -4,
  tabIndex: -1,
  select: 'none',
})

export const ListTitle = withStaticProperties(ListTitleComponent, {
  Icon: ListItemIcon,
  Text: ListTitleText,
})
