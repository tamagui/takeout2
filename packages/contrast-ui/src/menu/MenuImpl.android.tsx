import { One } from 'one'
import { memo } from 'react'
import { MenuPassThrough, useNativeMenu } from './nativeMenu'
import type { MenuTriggerProps } from './types'

export type * from './types'

// the android leg: the trigger's entries become One's system menu, a PopupMenu anchored to the trigger.
// the mapping and what it cannot carry live in nativeMenu.tsx.
export const MenuTrigger = memo(({ children, items }: MenuTriggerProps) => {
  const menu = useNativeMenu(items, 'android')
  return (
    <One.Android.Menu
      items={menu.items}
      onAction={menu.select}
      onValueChange={menu.select}
      accessibilityLabel=""
    >
      {children}
    </One.Android.Menu>
  )
})

export const GlobalMenuProvider = MenuPassThrough

export const Menu = {
  Trigger: MenuTrigger,
  Group: MenuPassThrough,
}
