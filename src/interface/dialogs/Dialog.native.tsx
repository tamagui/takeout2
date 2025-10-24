import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet'
import { BlurView } from 'expo-blur'
import {
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactElement,
  type ReactNode,
} from 'react'
import { TouchableOpacity } from 'react-native'
import {
  ScrollView,
  Separator,
  SizableText,
  styled,
  useTheme,
  withStaticProperties,
  XStack,
  YStack,
} from 'tamagui'
import { haptics } from '~/interface/haptics/haptics'
import { dialogEmit } from './shared'

const DialogOpenContext = createContext<boolean>(false)
export const useDialogOpen = () => useContext(DialogOpenContext)

interface DialogComponentProps {
  children?: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  minH?: number
  minW?: number
  snapPoints?: (string | number)[]
}

const DialogComponent = ({
  children,
  open = false,
  onOpenChange,
  snapPoints = ['85%'],
  minH = 400,
}: DialogComponentProps) => {
  const bottomSheetRef = useRef<BottomSheetModal>(null)
  const theme = useTheme()

  // Convert snapPoints to proper format
  const snapPointsMemo = useMemo(() => snapPoints, [snapPoints])

  // Handle backdrop
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  )

  // Handle sheet changes
  const handleSheetChanges = useCallback(
    (index: number) => {
      const isOpen = index >= 0
      onOpenChange?.(isOpen)

      // Emit dialog closed event when sheet is closed
      if (!isOpen) {
        dialogEmit({ type: 'closed' })
        // Haptic feedback when dialog closes
        haptics.modalClose()
      }
    },
    [onOpenChange]
  )

  // Control sheet based on open prop
  useEffect(() => {
    if (open) {
      bottomSheetRef.current?.present()
      // Haptic feedback when dialog opens
      haptics.modalOpen()
    } else {
      bottomSheetRef.current?.dismiss()
    }
  }, [open])

  return (
    <>
      <DialogOpenContext.Provider value={!!open}>
        <BottomSheetModal
          ref={bottomSheetRef}
          snapPoints={snapPointsMemo}
          onChange={handleSheetChanges}
          backdropComponent={renderBackdrop}
          enablePanDownToClose
          handleIndicatorStyle={{
            backgroundColor: theme.color8?.val || '#8E8E93',
            width: 36,
            height: 5,
            borderRadius: 3,
            marginTop: 8,
          }}
          backgroundComponent={({ style }) => (
            <BlurView
              intensity={80}
              tint="default"
              style={[style, { borderRadius: 20, overflow: 'hidden' }]}
            />
          )}
          bottomInset={0}
          detached={false}
        >
          <BottomSheetView
            style={{
              flex: 1,
              padding: 16,
              minHeight: minH,
            }}
          >
            {children}
          </BottomSheetView>
        </BottomSheetModal>
      </DialogOpenContext.Provider>
    </>
  )
}

const DialogTitle = styled(SizableText, {
  name: 'DialogTitle',
  fontFamily: '$mono',
  size: '$5',
  text: 'center',
})

const DialogDescription = styled(SizableText, {
  name: 'DialogDescription',
  size: '$4',
  opacity: 0.65,
})

const DialogHeader = ({
  title,
  description,
  hidden,
}: {
  hidden?: boolean
  title?: string
  description?: string
}) => {
  const content = (
    <YStack pointerEvents="box-none" gap="$3" mb="$3">
      <DialogTitle pointerEvents="none">{title}</DialogTitle>
      <DialogDescription>{description}</DialogDescription>
    </YStack>
  )

  // For native, we don't have VisuallyHidden, so just return null if hidden
  if (hidden) {
    return null
  }

  return content
}

const DialogFooter = (props: { children: any }) => {
  return (
    <YStack gap="$3">
      <Separator opacity={0.5} />
      <XStack justify="flex-end" gap="$2">
        {props.children}
      </XStack>
    </YStack>
  )
}

const DialogBody = (props: { children: any; scrollable?: boolean }) => {
  const content = (
    <YStack flex={1} gap="$2" px="$1" pb="$4">
      {props.children}
    </YStack>
  )

  if (props.scrollable) {
    return (
      <ScrollView m="$-1">
        <YStack gap="$2" px="$1">
          {content}
        </YStack>
      </ScrollView>
    )
  }

  return content
}

// DialogClose component for native
const DialogClose = ({
  children,
  asChild,
  ...props
}: {
  children: ReactNode
  asChild?: boolean
  [key: string]: any
}) => {
  const handlePress = props.onPress

  if (asChild && isValidElement(children)) {
    // Clone the child and add the onPress handler
    return cloneElement(children as ReactElement<any>, {
      ...props,
      onPress: (e: any) => {
        handlePress?.(e)
        ;(children as any).props?.onPress?.(e)
      },
    })
  }

  return <TouchableOpacity onPress={handlePress}>{children}</TouchableOpacity>
}

const DialogCloseButton = styled(YStack, {
  name: 'DialogCloseButton',
})

const DialogContent = styled(YStack, {
  name: 'DialogContent',
  flex: 1,
})

export const Dialog = withStaticProperties(DialogComponent, {
  Title: DialogTitle,
  Description: DialogDescription,
  CloseButton: DialogCloseButton,
  Content: DialogContent,
  Header: DialogHeader,
  Body: DialogBody,
  Footer: DialogFooter,
  Close: DialogClose,
})
