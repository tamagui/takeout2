import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet'
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react'
import { SizableText, useTheme, View, XStack, YStack } from 'tamagui'
import haptics from '~/helpers/haptics/haptics'
import { ButtonSimple } from '../buttons/ButtonSimple'

export interface ErrorSheetData {
  title: string
  description?: string
  buttonText?: string
  buttonAction?: () => void
  onCancel?: () => void
  cancelText?: string
}

export interface BottomErrorSheetRef {
  show: (data: ErrorSheetData) => void
  hide: () => void
}

interface BottomErrorSheetProps {
  ref?: React.Ref<BottomErrorSheetRef>
}

export const BottomErrorSheet = forwardRef<BottomErrorSheetRef, BottomErrorSheetProps>(
  (_, ref) => {
    const bottomSheetModalRef = useRef<BottomSheetModal>(null)
    const theme = useTheme()
    const [errorData, setErrorData] = useState<ErrorSheetData | null>(null)

    useImperativeHandle(ref, () => ({
      show: (data: ErrorSheetData) => {
        setErrorData(data)
        bottomSheetModalRef.current?.present()
        haptics.modalOpen()
      },
      hide: () => {
        bottomSheetModalRef.current?.dismiss()
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

    const handleSheetChanges = useCallback((index: number) => {
      if (index === -1) {
        haptics.modalClose()
        // Clear data after sheet closes
        setTimeout(() => setErrorData(null), 300)
      }
    }, [])

    const handleButtonAction = () => {
      bottomSheetModalRef.current?.dismiss()
      // Defer action to avoid conflicts
      if (errorData?.buttonAction) {
        setTimeout(() => errorData.buttonAction?.(), 100)
      }
    }

    const handleCancel = () => {
      bottomSheetModalRef.current?.dismiss()
      if (errorData?.onCancel) {
        setTimeout(() => errorData.onCancel?.(), 100)
      }
    }

    return (
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
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
        detached={false}
      >
        <BottomSheetView
          style={{
            flex: 1,
            paddingBottom: 36,
          }}
        >
          <View flex={1} px="$4" gap="$4">
            <YStack gap="$3" py="$2">
              {/* Title */}
              <SizableText text="center" fontWeight="600" fontSize={20}>
                {errorData?.title || 'Error'}
              </SizableText>

              {/* Description */}
              {errorData?.description && (
                <SizableText text="center" fontSize={16} opacity={0.8}>
                  {errorData.description}
                </SizableText>
              )}

              {/* Buttons */}
              <XStack justify="center" gap="$3" mt="$4">
                <ButtonSimple size="medium" width="100%" onPress={handleCancel}>
                  {errorData?.cancelText || 'Cancel'}
                </ButtonSimple>

                {errorData?.buttonAction && (
                  <ButtonSimple size="medium" width="100%" onPress={handleButtonAction}>
                    {errorData?.buttonText}
                  </ButtonSimple>
                )}
              </XStack>
            </YStack>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    )
  }
)
