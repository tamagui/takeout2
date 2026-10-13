import { One } from 'one'
import { memo } from 'react'
import { MenuPassThrough, useNativeMenu } from './nativeMenu'
import type { MenuTriggerProps } from './types'

export type * from './types'

// the ios leg: the trigger's entries become One's system menu, a SwiftUI Menu.
// the mapping and what it cannot carry live in nativeMenu.tsx.
export const MenuTrigger = memo(({ children, items }: MenuTriggerProps) => {
  const menu = useNativeMenu(items, 'ios')
  return (
    <One.iOS.Menu
      items={menu.items}
      onAction={menu.select}
      onValueChange={menu.select}
      accessibilityLabel=""
    >
      {children}
    </One.iOS.Menu>
  )
})

export const GlobalMenuProvider = MenuPassThrough

export const Menu = {
  Trigger: MenuTrigger,
  Group: MenuPassThrough,
}
