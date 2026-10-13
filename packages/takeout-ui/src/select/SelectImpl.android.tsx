import { useRef, useState } from 'react'
import { Modal, useWindowDimensions, View } from 'react-native'
import { ScrollView, SizableText, XStack, YStack } from 'tamagui'
import { CaretDownIcon } from '../icons/phosphor/CaretDownIcon'
import { CaretUpIcon } from '../icons/phosphor/CaretUpIcon'
import { emptySelectionLabel, useSelectValue } from './useSelectValue'
import type { SelectProps } from './selectContract'

// the android leg: an M3 exposed dropdown menu. the metrics below are the M3
// roles, not kit inventions: a 56dp outlined field with a floated label, a
// 24dp trailing icon, and a 4dp surface-container menu of 48dp rows. text
// rides the type scale's exact M3 twins (xs is body-small 12/16, sm is
// label-large 14/20, base is body-large 16/24 on the shared tailwind scale),
// which keeps size and line height paired; colors ride the product tokens
// (outline, on-surface, on-surface-variant, surface-container, primary), so
// the shape is M3's and the palette is the app's. size, width, and the sheet
// breakpoint are web props the contract accepts and this leg ignores.

// the menu shows about four and a half rows before scrolling: four 48dp rows
// plus the 16dp of vertical padding.
const MENU_MAX_HEIGHT = 232
const MENU_VERTICAL_PADDING = 8
const MENU_ROW_HEIGHT = 48
const MENU_GAP = 4

type Anchor = { x: number; y: number; width: number; height: number }

// the measured native view. the shared program resolves View's own ref type
// to the renderer's element, which carries no measure, so the seam is typed
// structurally and probed with a guard.
type MeasuredView = {
  measureInWindow: (
    callback: (x: number, y: number, width: number, height: number) => void,
  ) => void
}

function isMeasuredView(node: unknown): node is MeasuredView {
  return (
    typeof node === 'object' &&
    node !== null &&
    'measureInWindow' in node &&
    typeof node.measureInWindow === 'function'
  )
}

export function Select({
  items,
  label,
  value,
  defaultValue,
  onValueChange,
  testID,
  'aria-label': ariaLabel,
}: SelectProps) {
  const [id, setId] = useSelectValue({ items, value, defaultValue, onValueChange })
  const selected = items.find((item) => item.id === id)

  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState<Anchor | null>(null)
  const triggerRef = useRef<MeasuredView | null>(null)
  const { height: windowHeight } = useWindowDimensions()

  const openMenu = () => {
    // the menu floats in a window-level modal, so it opens off the field's
    // window rect rather than its layout box, which a scrolling parent would
    // clip. collapsable={false} keeps the native view around to measure.
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height })
      setOpen(true)
    })
  }
  const closeMenu = () => setOpen(false)

  const choose = (itemId: string) => {
    setId(itemId)
    setOpen(false)
  }

  // the menu drops below the field and flips above it when the room below is
  // short and the room above is longer, which is the M3 menu placement.
  const menuHeight = anchor
    ? Math.min(
        items.length * MENU_ROW_HEIGHT + MENU_VERTICAL_PADDING * 2,
        MENU_MAX_HEIGHT,
      )
    : 0
  const spaceBelow = anchor ? windowHeight - (anchor.y + anchor.height + MENU_GAP) : 0
  const above = !!anchor && spaceBelow < menuHeight && anchor.y > spaceBelow
  const menuTop = anchor
    ? above
      ? Math.max(8, anchor.y - MENU_GAP - menuHeight)
      : anchor.y + anchor.height + MENU_GAP
    : 0

  return (
    <View
      ref={(node) => {
        triggerRef.current = isMeasuredView(node) ? node : null
      }}
      collapsable={false}
    >
      <YStack
        minH={56}
        borderWidth={open ? 2 : 1}
        borderColor={open ? 'accent-background' : 'border-color'}
        rounded={4}
        px={16}
        justify="center"
        cursor="pointer"
        onPress={open ? closeMenu : openMenu}
        testID={testID}
        aria-label={ariaLabel ?? label}
        accessibilityState={{ expanded: open }}
      >
        {/* the label docks inside an empty field and floats on focus or selection. */}
        {selected || open ? (
          <SizableText
            position="absolute"
            t={-8}
            l={12}
            px={4}
            bg="background"
            size="xs"
            color={open ? 'accent-background' : 'color-10'}
          >
            {label}
          </SizableText>
        ) : null}
        <XStack gap={8} items="center">
          <SizableText
            flex={1}
            size="base"
            color={selected ? 'color' : 'color-10'}
            numberOfLines={1}
          >
            {selected?.name ?? (open ? emptySelectionLabel(label) : label)}
          </SizableText>
          {open ? (
            <CaretUpIcon size={24} color="color-10" />
          ) : (
            <CaretDownIcon size={24} color="color-10" />
          )}
        </XStack>
      </YStack>

      <Modal visible={open} transparent animationType="none" onRequestClose={closeMenu}>
        <View style={{ flex: 1 }}>
          <YStack
            position="absolute"
            inset={0}
            onPress={closeMenu}
            aria-label="Dismiss"
          />
          {anchor ? (
            <YStack
              position="absolute"
              t={menuTop}
              l={anchor.x}
              width={anchor.width}
              maxH={MENU_MAX_HEIGHT}
              py={MENU_VERTICAL_PADDING}
              bg="color-2"
              rounded={4}
              boxShadow="0 4px 12px shadow-color"
              overflow="hidden"
            >
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {items.map((item) => (
                  <XStack
                    key={item.id}
                    minH={MENU_ROW_HEIGHT}
                    px={12}
                    py={8}
                    gap={12}
                    items="center"
                    bg="transparent press:color-3"
                    cursor="pointer"
                    onPress={() => choose(item.id)}
                    testID={testID ? `${testID}-item-${item.id}` : undefined}
                    aria-label={item.name}
                  >
                    {item.icon}
                    <SizableText flex={1} size="sm" color="color" numberOfLines={1}>
                      {item.name}
                    </SizableText>
                  </XStack>
                ))}
              </ScrollView>
            </YStack>
          ) : null}
        </View>
      </Modal>
    </View>
  )
}
