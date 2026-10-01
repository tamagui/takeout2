import { One } from 'one'
import { isValidElement, memo, useMemo, type ComponentProps, type ReactNode } from 'react'
import { isSeparator, isTitle, type MenuEntry, type MenuItem } from './types'

// the shared half of the native legs: MenuImpl.ios.tsx and
// MenuImpl.android.tsx hand this mapping's items to One.iOS.Menu and
// One.Android.Menu, which take the same item shape.
//
// the system menu draws, positions, and dismisses itself, and only one is
// ever open, which is what the web leg's global provider exists to enforce,
// so on native the provider and the group pass their children through.
//
// One reports a selection and nothing else: no open or close event reaches
// JS, so onOpenChange and onMouseEnter are web only and never fire here.

type NativeMenuItem = ComponentProps<typeof One.Android.Menu>['items'][number]
type NativeMenuPlatform = 'ios' | 'android'

const warnedUnsupported = new Set<string>()

// an embellishment the system menu cannot draw is dropped, never thrown on,
// and says so once in dev so an app author sees what the menu leaves out
function warnUnsupported(feature: string) {
  if (warnedUnsupported.has(feature) || process.env.NODE_ENV === 'production') return
  warnedUnsupported.add(feature)
  console.warn(
    `[contrast-ui] native menus do not draw ${feature}, so it will not render.`,
  )
}

// a system menu item takes an SF Symbol name, never a view. sfSymbol() tags
// its icon with the name, so it is read off the component or the element's
// type without rendering anything; any other icon has no symbol to give.
// One's android popup draws no icons at all.
function systemImageOf(icon: MenuItem['icon'], platform: NativeMenuPlatform): string {
  if (icon == null || icon === false) return ''
  if (platform === 'android') {
    warnUnsupported('item icons on android')
    return ''
  }
  const source = isValidElement(icon) ? icon.type : icon
  if (
    typeof source === 'function' &&
    'systemName' in source &&
    typeof source.systemName === 'string'
  ) {
    return source.systemName
  }
  warnUnsupported('icons other than sfSymbol()')
  return ''
}

function toNativeItem(
  item: MenuItem,
  id: string,
  platform: NativeMenuPlatform,
  handlers: Map<string, () => void>,
): NativeMenuItem {
  if (item.right != null) warnUnsupported('right-aligned item content')
  // a system menu row has no subtitle slot. One carries a description as
  // SwiftUI's .help(), which ios reads to accessibility and shows only on
  // pointer hover, and android drops it
  if (item.description) warnUnsupported('item descriptions as a visible subtitle')
  // android's popup has no destructive role and always closes on a selection
  if (platform === 'android') {
    if (item.destructive) warnUnsupported('destructive styling on android')
    if (item.preventClose) warnUnsupported('preventClose on android')
  }
  const title = item.text
  const disabled = item.disabled === true
  const help = item.description
  const menuActionDismissBehavior = item.preventClose ? 'disabled' : undefined

  if (item.items && item.items.length > 0) {
    if (item.destructive) warnUnsupported('a destructive submenu')
    return {
      type: 'submenu',
      id,
      title,
      systemImage: systemImageOf(item.icon, platform),
      disabled,
      help,
      children: toNativeItems(item.items, `${id}.`, platform, handlers),
    }
  }

  const { action } = item
  if (action) handlers.set(id, () => void action())

  // the web leg draws the check in place of the icon, so a toggle carries no
  // symbol; the system draws its own checkmark for radio and checkbox alike
  if (item.type === 'radio' || item.type === 'checkbox') {
    if (item.destructive) warnUnsupported('a destructive checkbox or radio item')
    return {
      type: 'toggle',
      id,
      title,
      values: [item.checked === true],
      disabled,
      help,
      menuActionDismissBehavior,
    }
  }

  return {
    type: 'action',
    id,
    title,
    systemImage: systemImageOf(item.icon, platform),
    role: item.destructive ? 'destructive' : undefined,
    disabled,
    help,
    menuActionDismissBehavior,
  }
}

// ids are the entry's index path, which is stable across renders and unique
// within the menu as One requires. on ios a title heads a section holding the
// entries after it up to the next title or separator. android's popup has no
// section header or divider, and One draws a section there as a submenu, so
// the title is dropped and its entries stay inline.
function toNativeItems(
  entries: MenuEntry[],
  path: string,
  platform: NativeMenuPlatform,
  handlers: Map<string, () => void>,
): NativeMenuItem[] {
  const items: NativeMenuItem[] = []
  let section: NativeMenuItem[] | null = null

  entries.forEach((entry, index) => {
    const id = `${path}${index}`
    if (isSeparator(entry)) {
      if (platform === 'android') warnUnsupported('separators on android')
      section = null
      items.push({ type: 'divider', id })
      return
    }
    if (isTitle(entry)) {
      section = null
      if (platform === 'android') {
        warnUnsupported('menu titles on android')
        return
      }
      const children: NativeMenuItem[] = []
      section = children
      items.push({ type: 'section', id, title: entry.text, children })
      return
    }
    const target = section ?? items
    target.push(toNativeItem(entry, id, platform, handlers))
  })

  return items
}

// a selection and a toggle's value change both run the entry's action: the
// app owns `checked` and hands the menu its next state through `items`
export function useNativeMenu(entries: MenuEntry[], platform: NativeMenuPlatform) {
  return useMemo(() => {
    const handlers = new Map<string, () => void>()
    const items = toNativeItems(entries, '', platform, handlers)
    return { items, select: (id: string) => handlers.get(id)?.() }
  }, [entries, platform])
}

export const MenuPassThrough = memo(({ children }: { children: ReactNode }) => (
  <>{children}</>
))
