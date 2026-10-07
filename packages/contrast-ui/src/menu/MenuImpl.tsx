import { createEmitter, isEqualIdentity, useEmitterValue } from '@o/helpers'
import { Menu as TamaguiMenu } from '@tamagui/menu'
import {
  createContext,
  memo,
  use,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { prevent, styled, useEvent } from 'tamagui'
import { useEscapeHandler } from '../keyboard/escape'
import { useHardwareBackHandler } from '../keyboard/hardwareBack'
import { MenuItemContent } from './MenuItemContent'
import { MenuContentsFrame, MenuSeparator, MenuTitle } from './MenuShared'
import {
  isMenuItem,
  isSeparator,
  isTitle,
  type MenuEntry,
  type MenuItem,
  type MenuTriggerProps,
} from './types'

export type * from './types'

export type MenuState = {
  items: MenuEntry[]
  onOpenChange?: (open: boolean) => void
  fromGroup?: boolean
}

// every trigger in the app publishes into one menu, so only one is ever open
// and the open one is the last trigger that asked for it
export const globalMenuEmitter = createEmitter<MenuState | null>('global-menu', null, {
  comparator: isEqualIdentity,
})

// a ref rather than state: a trigger checks whether the menu is open on hover,
// and subscribing every trigger to that would re-render the whole toolbar on
// each open and close
const MenuOpenContext = createContext<{ current: boolean }>({ current: false })

// inside a group, hovering a sibling trigger switches the open menu to it
const MenuGroupContext = createContext(false)

export const GlobalMenuProvider = memo(({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false)
  const openRef = useRef(false)

  // always subscribed so an item's checked state updates while the menu is
  // open; re-emission from a hovered trigger is blocked at the trigger itself
  const state = useEmitterValue(globalMenuEmitter)

  const close = useEvent(() => {
    openRef.current = false
    setOpen(false)
    state?.onOpenChange?.(false)
  })

  useEscapeHandler(close, open)
  useHardwareBackHandler(close, open)

  return (
    <MenuOpenContext.Provider value={openRef}>
      <TamaguiMenu
        open={open}
        onOpenChange={(isOpen) => {
          openRef.current = isOpen
          setOpen(isOpen)
          state?.onOpenChange?.(isOpen)
        }}
      >
        {children}

        <MenuContent items={state?.items} animatePosition={state?.fromGroup} />
      </TamaguiMenu>
    </MenuOpenContext.Provider>
  )
})

export const MenuTrigger = memo(
  ({
    children,
    items,
    onOpenChange: onOpenChangeProp,
    onMouseEnter,
  }: MenuTriggerProps) => {
    const onOpenChange = useEvent(onOpenChangeProp)
    const menuOpenRef = use(MenuOpenContext)
    const inGroup = use(MenuGroupContext)

    const menuState = useMemo(
      () => ({ items, onOpenChange, fromGroup: inGroup }),
      [items, onOpenChange, inGroup],
    )

    const hasEmitted = useRef(false)

    useEffect(() => {
      // re-emit when this trigger's own items change, so a checked state
      // written while the menu is open reaches the open menu
      if (hasEmitted.current && items.length > 0) {
        globalMenuEmitter.emit(menuState)
      }
    }, [menuState, items])

    const prepareMenu = () => {
      hasEmitted.current = true
      onMouseEnter?.()
      globalMenuEmitter.emit(menuState)
    }

    return (
      <TamaguiMenu.Trigger
        onMouseEnter={(event: MouseEvent) => {
          // a hover must not replace the open menu's contents, or moving the
          // pointer toward the menu swaps it out on the way
          if (menuOpenRef.current && !inGroup) {
            event.stopPropagation()
            event.preventDefault()
            return
          }
          prepareMenu()
        }}
        onFocus={() => {
          if (menuOpenRef.current && !inGroup) return
          prepareMenu()
        }}
        // the touch trigger: a tap publishes this trigger's items before
        // tamagui toggles the menu open, the way hover does on web. without
        // it a touch opens whatever items were last published. on web this
        // also fixes a click that arrives with no hover before it.
        onPress={() => {
          if (menuOpenRef.current && !inGroup) return
          prepareMenu()
        }}
      >
        {children}
      </TamaguiMenu.Trigger>
    )
  },
)

const MenuItemFrame = styled(TamaguiMenu.Item, {
  gap: '2',
  px: '1',
  py: 6,
  maxH: 34,
  minW: 185,
  items: 'center',
  cursor: 'default',
  flexDirection: 'row',
  rounded: '2',
  bg: 'transparent hover:background-hover press:background-press focus:background-focus',
})

// tamagui's Content ships its own frame styling and ignores `unstyled`, so the
// visible frame is MenuContentsFrame inside it and this clears the outer one;
// the outer one carries the entering transform instead.
const contentFrame = {
  p: 0,
  boxShadow: 'none',
  bg: 'transparent',
  borderWidth: 0,
  y: 'enter:-8px exit:-4px',
  opacity: 'enter:0 exit:0',
  scale: 'enter:0.925 exit:0.98',
  transition: { duration: 75, properties: 'transform, opacity' },
} as const

const MenuContentFrame = styled(TamaguiMenu.Content, contentFrame)
const MenuSubContentFrame = styled(TamaguiMenu.SubContent, contentFrame)

const MenuItemRow = memo(({ item }: { item: MenuItem }) => {
  const onSelect = useEvent((event: { preventDefault: () => void }) => {
    if (item.disabled) return
    if (item.preventClose) event.preventDefault()
    item.action?.()
  })

  return (
    <MenuItemFrame
      preventCloseOnSelect={item.preventClose}
      onSelect={onSelect}
      aria-checked={item.type ? Boolean(item.checked) : undefined}
      aria-disabled={item.disabled ? true : undefined}
      opacity={item.disabled ? 0.4 : 1}
      cursor={item.disabled ? 'not-allowed' : 'default'}
    >
      <MenuItemContent
        icon={item.icon}
        description={item.description}
        type={item.type}
        checked={item.checked}
        destructive={item.destructive}
        right={item.right}
      >
        {item.text}
      </MenuItemContent>
    </MenuItemFrame>
  )
})

const MenuSubMenu = memo(({ item }: { item: MenuItem & { items: MenuEntry[] } }) => {
  const [open, setOpen] = useState(false)

  return (
    <TamaguiMenu.Sub open={open} onOpenChange={setOpen}>
      <TamaguiMenu.SubTrigger p={0} asChild="except-style-web" textValue={item.text}>
        <MenuItemFrame>
          <MenuItemContent
            icon={item.icon}
            description={item.description}
            type={item.type}
            checked={item.checked}
            destructive={item.destructive}
            hasSubmenu
          >
            {item.text}
          </MenuItemContent>
        </MenuItemFrame>
      </TamaguiMenu.SubTrigger>

      <TamaguiMenu.Portal>
        <MenuSubContentFrame>
          <MenuContentsFrame onPressIn={prevent} onPressOut={prevent}>
            {renderMenuEntries(item.items)}
          </MenuContentsFrame>
        </MenuSubContentFrame>
      </TamaguiMenu.Portal>
    </TamaguiMenu.Sub>
  )
})

function renderMenuEntries(entries?: MenuEntry[]) {
  if (!entries) return null

  return entries.map((entry, index) => {
    if (isSeparator(entry)) {
      return <MenuSeparator key={`separator-${index}`} />
    }

    if (isTitle(entry)) {
      return <MenuTitle key={`title-${index}`} title={entry.text} />
    }

    if (!isMenuItem(entry)) return null

    const { items } = entry
    if (items && items.length > 0) {
      return (
        <MenuSubMenu key={`submenu-${entry.text}-${index}`} item={{ ...entry, items }} />
      )
    }

    return <MenuItemRow key={`item-${entry.text}-${index}`} item={entry} />
  })
}

const MenuContent = memo(
  ({ items, animatePosition }: { items?: MenuEntry[]; animatePosition?: boolean }) => {
    return (
      <TamaguiMenu.Portal>
        <MenuContentFrame
          onCloseAutoFocus={(event) => event.cancel()}
          animatePosition={animatePosition}
        >
          <MenuContentsFrame>{renderMenuEntries(items)}</MenuContentsFrame>
        </MenuContentFrame>
      </TamaguiMenu.Portal>
    )
  },
)

const MenuGroup = memo(({ children }: { children: ReactNode }) => {
  return <MenuGroupContext.Provider value={true}>{children}</MenuGroupContext.Provider>
})

export const Menu = {
  Trigger: MenuTrigger,
  Group: MenuGroup,
}
