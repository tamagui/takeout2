import { sleep } from '@take-out/helpers'
import { useRef } from 'react'
import {
  ScrollView,
  Separator,
  Theme,
  YStack,
  prevent,
  withStaticProperties,
  type PopoverProps,
} from 'tamagui'

import { animationClamped } from '../animations/animationClamped'
import { Popover } from '../popover/Popover'
import { MenuItem } from './MenuItem'

export type MenuItemType =
  | {
      id: string
      icon?: any
      children: React.ReactNode
      onPress?: () => void | Promise<void>
      theme?: string
    }
  | {
      separator: true
    }

export type MenuItems = (MenuItemType | null)[]

export type MenuProps = {
  items: MenuItems
  popoverProps?: PopoverProps
  children: React.ReactNode
}

const MenuTrigger = ({ children, ...props }: any) => {
  return (
    // prevent parent items getting press event
    <YStack onPressIn={prevent} onPressOut={prevent}>
      <Popover.Trigger
        onDoubleClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        asChild
        {...props}
      >
        {children}
      </Popover.Trigger>
    </YStack>
  )
}

const MenuContent = ({ children, ...props }: any) => {
  return (
    <Popover.Content
      transition={animationClamped('quickestLessBouncy')}
      onCloseAutoFocus={(e) => e.preventDefault()}
      minW={200}
      {...props}
    >
      <YStack
        // prevent parent items getting press event
        onPressIn={prevent}
        onPressOut={prevent}
        width="100%"
        rounded="$4"
        overflow="hidden"
      >
        <ScrollView width="100%">{children}</ScrollView>
      </YStack>
    </Popover.Content>
  )
}

const MenuComponent = ({ items, popoverProps, children }: MenuProps) => {
  const popoverRef = useRef<Popover>(null)

  return (
    <Popover name="menu" resize ref={popoverRef} {...popoverProps}>
      {children}

      <MenuContent>
        {items?.map((item, index) => {
          if (!item) return null

          if ('separator' in item) {
            return <Separator key={index} width="100%" opacity={0.25} />
          }

          const { theme, icon, children: itemChildren, onPress, id } = item

          return (
            <Theme key={id} name={theme as any}>
              <MenuItem
                id={id}
                icon={icon}
                onPress={async () => {
                  popoverRef.current?.close()
                  // allow popover to at least start closing
                  await sleep(30)
                  await onPress?.()
                }}
              >
                {itemChildren}
              </MenuItem>
            </Theme>
          )
        })}
      </MenuContent>
    </Popover>
  )
}

export const Menu = withStaticProperties(MenuComponent, {
  Trigger: MenuTrigger,
  Item: MenuItem,
  Content: MenuContent,
  Separator,
})
