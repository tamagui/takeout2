import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet'
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react'
import { SizableText, useTheme, View, XStack } from 'tamagui'

import { XCircleIcon } from '~/interface/icons/phosphor/XCircleIcon'

import { Pressable } from '../buttons/Pressable'

import type { SheetProps, SheetRef } from './Sheet.types'

export const Sheet = forwardRef<SheetRef, SheetProps>(
  ({ onClose, onOpenChange, title, children, snapPoints, contentStyle }, ref) => {
    const bottomSheetRef = useRef<BottomSheet>(null)
    const theme = useTheme()

    useImperativeHandle(ref, () => ({
      expand: () => {
        bottomSheetRef.current?.snapToIndex(0)
      },
      collapse: () => {
        bottomSheetRef.current?.close()
      },
    }))

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.8}
          pressBehavior="close"
        />
      ),
      []
    )

    const handleSheetChanges = useCallback(
      (index: number) => {
        const isOpen = index !== -1
        onOpenChange?.(isOpen)
        if (index === -1) {
          onClose?.()
        }
      },
      [onClose, onOpenChange]
    )

    return (
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        {...(snapPoints ? { snapPoints } : {})}
        onChange={handleSheetChanges}
        backdropComponent={renderBackdrop}
        enablePanDownToClose
        enableDynamicSizing
        backgroundComponent={({ style }) => (
          <View
            style={[
              style,
              { borderTopRightRadius: 28, borderTopLeftRadius: 28, overflow: 'hidden' },
            ]}
            bg="$color2"
          />
        )}
        handleIndicatorStyle={{
          backgroundColor: theme.color6?.val,
          width: 36,
          height: 5,
          borderRadius: 3,
        }}
        style={{
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
        }}
        bottomInset={0}
      >
        <BottomSheetView
          style={{
            flex: 1,
            paddingBottom: 40,
          }}
        >
          <View flex={1} px={14} gap="$4" {...contentStyle}>
            {!!title && (
              <XStack items="center" justify="space-between" px="$1">
                <SizableText text="center" fontWeight="600" fontSize={20}>
                  {title}
                </SizableText>
                <Pressable
                  onPress={() => {
                    bottomSheetRef.current?.close()
                  }}
                >
                  <XCircleIcon size={28} color="$color" opacity={0.2} />
                </Pressable>
              </XStack>
            )}
            {children}
          </View>
        </BottomSheetView>
      </BottomSheet>
    )
  }
)
