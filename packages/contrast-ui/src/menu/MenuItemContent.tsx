import { createElement, memo, type ReactNode } from 'react'
import { AnimatePresence, SizableText, Theme, View, XStack, YStack } from 'tamagui'
import { CaretRightIcon } from '../icons/phosphor/CaretRightIcon'
import { CheckIcon } from '../icons/phosphor/CheckIcon'
import { isIconComponent, type MenuItem } from './types'

export type MenuItemContentProps = Pick<
  MenuItem,
  'icon' | 'description' | 'type' | 'checked' | 'destructive' | 'right'
> & {
  children: ReactNode
  hasSubmenu?: boolean
}

// the row itself, shared by plain items and submenu triggers so the two cannot
// drift apart on padding, truncation, or indicator placement.
export const MenuItemContent = memo(
  ({
    icon,
    children,
    description,
    type,
    checked,
    destructive,
    right,
    hasSubmenu,
  }: MenuItemContentProps) => {
    const isRadioOrCheckbox = type === 'radio' || type === 'checkbox'
    const iconElement = isRadioOrCheckbox ? (
      <CheckIcon size={12} />
    ) : isIconComponent(icon) ? (
      createElement(icon, { size: 14, opacity: 0.5 })
    ) : (
      icon
    )

    const content = (
      <XStack overflow="hidden" flex={1} mx="1" gap="2-5" items="center">
        {!!iconElement && (
          <XStack
            shrink={0}
            minW={16}
            items="center"
            justify="center"
            // the check glyph reads heavier than an icon at the same box size
            {...(isRadioOrCheckbox && { mr: -2, opacity: 0.65 })}
          >
            <AnimatePresence>
              {(isRadioOrCheckbox ? checked : true) && (
                <View opacity="enter:0 exit:0" y="enter:-2px exit:-2px">
                  {iconElement}
                </View>
              )}
            </AnimatePresence>
          </XStack>
        )}
        <YStack overflow="hidden" flex={1}>
          <SizableText
            size="2"
            select="none"
            fontFamily="mono"
            fontWeight={checked ? '500' : '400'}
            color="color"
            text="left"
            ellipsis
          >
            {children}
          </SizableText>
          {!!description && (
            <SizableText
              size="1"
              select="none"
              fontFamily="mono"
              color="placeholder-color"
              text="left"
              ellipsis
            >
              {description}
            </SizableText>
          )}
        </YStack>
        {right}
        {!!hasSubmenu && <CaretRightIcon size={12} color="border-color" />}
      </XStack>
    )

    if (destructive) {
      return <Theme name="red">{content}</Theme>
    }

    return content
  },
)
