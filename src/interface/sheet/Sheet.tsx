import { forwardRef, useImperativeHandle, useState } from 'react'
import { Sheet as TamaguiSheet, SizableText, View, XStack } from 'tamagui'

import { XCircleIcon } from '~/interface/icons/phosphor/XCircleIcon'

import { Pressable } from '../buttons/Pressable'

import type { SheetProps, SheetRef } from './Sheet.types'

export const Sheet = forwardRef<SheetRef, SheetProps>(
  (
    {
      open: controlledOpen,
      onOpenChange,
      onClose,
      title,
      children,
      snapPoints,
      contentStyle,
    },
    ref
  ) => {
    const [internalOpen, setInternalOpen] = useState(false)
    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen

    useImperativeHandle(ref, () => ({
      expand: () => {
        if (!isControlled) setInternalOpen(true)
        onOpenChange?.(true)
      },
      collapse: () => {
        if (!isControlled) setInternalOpen(false)
        onOpenChange?.(false)
        onClose?.()
      },
    }))

    const handleOpenChange = (isOpen: boolean) => {
      if (!isControlled) setInternalOpen(isOpen)
      onOpenChange?.(isOpen)
      if (!isOpen) onClose?.()
    }

    return (
      <TamaguiSheet
        modal
        open={open}
        onOpenChange={handleOpenChange}
        snapPoints={snapPoints as number[] | undefined}
        dismissOnSnapToBottom
        transition="quick"
      >
        <TamaguiSheet.Overlay
          transition="quick"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          bg="$background08"
        />
        <TamaguiSheet.Handle bg="$color6" />
        <TamaguiSheet.Frame bg="$color2" rounded="$6" pt="$2">
          <View flex={1} px={14} gap="$4" {...contentStyle}>
            {!!title && (
              <XStack items="center" justify="space-between" px="$1">
                <SizableText text="center" fontWeight="600" fontSize={20}>
                  {title}
                </SizableText>
                <Pressable onPress={() => handleOpenChange(false)}>
                  <XCircleIcon size={28} color="$color" opacity={0.2} />
                </Pressable>
              </XStack>
            )}
            {children}
          </View>
        </TamaguiSheet.Frame>
      </TamaguiSheet>
    )
  }
)
