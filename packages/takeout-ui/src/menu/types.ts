import { isValidElement, type ReactNode } from 'react'
import type { IconComponent } from '../icons/types'

// a menu is described as data rather than children so the same array can be
// handed to a trigger, a submenu, or a keyboard-driven command list.

export type MenuItemType = 'radio' | 'checkbox'

export type MenuSeparatorEntry = {
  type: 'separator'
}

export type MenuTitleEntry = {
  type: 'title'
  text: string
}

export type MenuItem = {
  text: string
  action?: () => void | Promise<void>
  icon?: ReactNode | IconComponent
  // a non-empty `items` turns this entry into a submenu; it may hold
  // separators and titles of its own
  items?: MenuEntry[]
  // draws a radio or checkbox indicator in place of the icon
  type?: MenuItemType
  checked?: boolean
  disabled?: boolean
  // red theme for an item that removes or discards something
  destructive?: boolean
  description?: string
  // right-aligned content, such as a shortcut badge
  right?: ReactNode
  // keep the menu open after this item is selected
  preventClose?: boolean
}

export type MenuEntry = MenuItem | MenuSeparatorEntry | MenuTitleEntry

export type MenuTriggerProps = {
  children: ReactNode
  items: MenuEntry[]
  // web only: the native system menu reports neither opening nor closing
  onOpenChange?: (open: boolean) => void
  // web only: a hover publishes this trigger's items before a click
  onMouseEnter?: () => void
}

export const isSeparator = (entry: MenuEntry): entry is MenuSeparatorEntry =>
  'type' in entry && entry.type === 'separator'

export const isTitle = (entry: MenuEntry): entry is MenuTitleEntry =>
  'type' in entry && entry.type === 'title'

export const isMenuItem = (entry: MenuEntry): entry is MenuItem =>
  !isSeparator(entry) && !isTitle(entry)

// an icon set built on memo() or forwardRef() exports objects rather than
// functions, so `typeof` alone cannot tell a component from a rendered element
export const isIconComponent = (icon: MenuItem['icon']): icon is IconComponent =>
  typeof icon === 'function' ||
  (typeof icon === 'object' &&
    icon !== null &&
    '$$typeof' in icon &&
    !isValidElement(icon))
