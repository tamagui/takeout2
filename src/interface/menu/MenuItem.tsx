import { createElement, isValidElement } from 'react'
import { SizableText, XStack, YStack } from 'tamagui'

export type MenuItemProps = {
  id: string
  icon?: any
  children: React.ReactNode
  onPress?: () => void | Promise<void>
}

export const MenuItem = ({ icon, children, onPress }: MenuItemProps) => {
  // normalize icon prop into a react element we can render
  const iconElement = icon
    ? isValidElement(icon)
      ? icon
      : createElement(icon as any, { size: 14, opacity: 0.35 })
    : null

  return (
    <XStack
      role="menuitem"
      gap="$2.5"
      px="$3"
      height={36}
      items="center"
      cursor="default"
      group="item"
      containerType="normal"
      onPress={onPress}
    >
      {iconElement}
      <SizableText size="$3" select="none" flex={1} fontWeight="400">
        {children}
      </SizableText>

      <YStack
        z={-1}
        fullscreen
        opacity={0.2}
        $group-item-hover={{
          bg: '$color3',
        }}
        $group-item-press={{
          bg: '$color1',
        }}
      />
    </XStack>
  )
}
