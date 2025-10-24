import { createStyledContext, type FontTokens } from 'tamagui'

export type ListItemVariant = 'default' | 'sidebar' | 'compact'
export type SimpleSize = 'small' | 'medium' | 'large'

const defaults = {
  active: false as boolean | 'strong',
  size: 'medium' as SimpleSize,
  fontFamily: '$mono' as FontTokens,
  variant: 'default' as ListItemVariant,
  editing: false,
  editable: false,
  disableHover: false,
  editingValue: '',
  onEditComplete: undefined as undefined | ((value: string) => void),
  onEditCancel: undefined as undefined | (() => void),
}

export const ListItemContext = createStyledContext(defaults)

export type ListItemContextProps = typeof defaults
