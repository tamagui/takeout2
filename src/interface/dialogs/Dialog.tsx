import { createGlobalContext, useAsyncEffect } from '@take-out/helpers'
import { use, useRef } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  DialogDescription,
  ScrollView,
  Separator,
  Sheet,
  Spacer,
  styled,
  Dialog as TamaguiDialog,
  VisuallyHidden,
  withStaticProperties,
  XStack,
  YStack,
  type DialogProps,
  type SizeTokens,
  type TamaguiElement,
} from 'tamagui'

import { useHandleEscapeIf } from '~/features/shortcuts/handleKeyboardEscape'

import { BlurView } from '../effects/BlurView'
import { dialogEmit } from './shared'

const CONTENT_RADIUS: SizeTokens = '$9'

const DialogComponent = ({
  children,
  minH = 400,
  minW = 450,
  open,
  ...props
}: DialogProps & { minH?: number; minW?: number }) => {
  const dialogContentRef = useRef<TamaguiElement>(null)
  const insets = useSafeAreaInsets()

  useHandleEscapeIf(!!open, () => {
    // TODO allow a throw AbortError that works with handleKeyboardEscape closeAllEscapables
    // if they are filling out a form it can show a confirm dialog and then cancel this
    // dialogEmit({ type: 'closed' })
  })

  // TODO this can move into above useHandleEscapeIf and no need for listener
  // just add helpers/browser isActiveElementFilledInput()
  useAsyncEffect(
    (signal) => {
      if (!open) return
      const node = dialogContentRef.current as HTMLElement
      if (!node) {
        return
      }
      node.addEventListener(
        'keyup',
        (e) => {
          if (e.code !== 'Escape') return
          if (
            !(
              e.target instanceof HTMLInputElement ||
              e.target instanceof HTMLTextAreaElement
            )
          )
            return
          if (e.target.value) return
          dialogEmit({ type: 'closed' })
        },
        {
          signal,
        }
      )
    },
    [open]
  )

  return (
    <DialogOpenContext.Provider value={!!open}>
      <TamaguiDialog modal open={open} {...props}>
        <TamaguiDialog.Adapt platform="touch" when="max-md">
          <Sheet
            transition="quickLessBouncy"
            zIndex={250_000}
            modal
            snapPointsMode="fit"
            dismissOnSnapToBottom
            moveOnKeyboardChange
          >
            <Sheet.Overlay
              bg="$shadow6"
              transition="medium"
              enterStyle={{ opacity: 0 }}
              exitStyle={{ opacity: 0 }}
              onPress={() => {
                props.onOpenChange?.(false)
              }}
            />
            <Sheet.Frame
              theme="surface2"
              p="$4"
              pb={insets.bottom + 100 + 30}
              y={100}
              gap="$4"
              rounded="$10"
              borderBottomRightRadius={0}
              borderBottomLeftRadius={0}
              bg="transparent"
              boxShadow="0px 0 40px $shadow6"
            >
              <YStack z={0} bg="$color5" opacity={0.5} inset={0} position="absolute" />
              <BlurView intensity={50} position="absolute" inset={0} />
              <Sheet.ScrollView>
                <TamaguiDialog.Adapt.Contents />
              </Sheet.ScrollView>
            </Sheet.Frame>
          </Sheet>
        </TamaguiDialog.Adapt>

        <TamaguiDialog.Portal z={500_000}>
          <DialogOverlay
            key="overlay"
            bg="$shadow6"
            onPress={(e) => {
              props.onOpenChange?.(false)
              e.stopPropagation()
              e.preventDefault()
            }}
          />

          <DialogContent
            ref={dialogContentRef}
            minH={minH}
            minW={minW}
            key="content"
            rounded={CONTENT_RADIUS}
            overflow="hidden"
            p="$3"
          >
            {children}
          </DialogContent>
        </TamaguiDialog.Portal>
      </TamaguiDialog>
    </DialogOpenContext.Provider>
  )
}

const DialogOverlay = styled(TamaguiDialog.Overlay, {
  transition: '200ms',
  opacity: 1,
  backdropFilter: 'blur(3px)',
  enterStyle: { opacity: 0 },
  exitStyle: { opacity: 0 },
})

const DialogContent = styled(TamaguiDialog.Content, {
  unstyled: true,
  z: 1000000,
  transition: '200ms',
  bg: '$background08',
  borderWidth: 0.5,
  rounded: CONTENT_RADIUS,
  borderColor: '$color3',
  position: 'relative',
  backdropFilter: 'blur(25px)',
  shadowColor: '$shadow3',
  shadowRadius: 20,
  shadowOffset: { height: 20, width: 0 },
  maxH: '90vh',
  width: '60%',
  minW: 200,
  maxW: 500,
  p: '$4',
  opacity: 1,
  y: 0,
  enterStyle: { x: 0, y: -5, opacity: 0, scale: 0.985 },
  exitStyle: { x: 0, y: 5, opacity: 0 },

  focusStyle: {
    outlineWidth: 2,
    outlineColor: '$background02',
    outlineStyle: 'solid',
  },
})

const DialogTitle = styled(TamaguiDialog.Title, {
  fontFamily: '$mono',
  size: '$5',
  text: 'center',
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
    <YStack pointerEvents="box-none" gap="$3">
      <DialogTitle size="$5" fontWeight="600" cursor="default" select="none">
        {title}
      </DialogTitle>
      {!!description && (
        <DialogDescription size="$4" color="$color10">
          {description}
        </DialogDescription>
      )}
    </YStack>
  )

  if (hidden) {
    return <VisuallyHidden>{content}</VisuallyHidden>
  }

  return content
}

const DialogFooter = (props: { children: any }) => {
  return (
    <>
      <Spacer flex={1} />
      <YStack gap="$3">
        <Separator opacity={0.5} />
        <XStack justify="flex-end" gap="$2">
          {props.children}
        </XStack>
      </YStack>
    </>
  )
}

const DialogBody = (props: { children: any; scrollable?: boolean }) => {
  const content = (
    <YStack flex={1} gap="$2" px="$1" pb="$3">
      {props.children}
    </YStack>
  )

  if (props.scrollable) {
    return (
      <ScrollView m="$-1">
        {/* add some extra bottom pad so it scrolls more naturally to bottom */}
        <YStack gap="$2" px="$1">
          {content}
        </YStack>
      </ScrollView>
    )
  }

  return content
}

export const Dialog = withStaticProperties(DialogComponent, {
  Header: DialogHeader,
  Body: DialogBody,
  Footer: DialogFooter,
  Close: TamaguiDialog.Close,
})

const DialogOpenContext = createGlobalContext('dialog/open-context', false)
export const useDialogOpen = () => use(DialogOpenContext)
