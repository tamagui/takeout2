import { createGlobalContext, useAsyncEffect } from '@take-out/helpers'
import { use, useRef } from 'react'
import {
  DialogDescription,
  ScrollView,
  Separator,
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
import { animationClamped } from '../animations/animationClamped'
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
        <TamaguiDialog.Adapt platform="touch" when="sm">
          <TamaguiDialog.Sheet
            animation="medium"
            zIndex={250_000}
            modal
            dismissOnSnapToBottom
          >
            <TamaguiDialog.Sheet.Overlay
              animation="quick"
              enterStyle={{ opacity: 0 }}
              exitStyle={{ opacity: 0 }}
            />
            <TamaguiDialog.Sheet.Handle />
            <TamaguiDialog.Sheet.Frame p="$4" gap="$4">
              <TamaguiDialog.Adapt.Contents />
            </TamaguiDialog.Sheet.Frame>
          </TamaguiDialog.Sheet>
        </TamaguiDialog.Adapt>

        <TamaguiDialog.Portal zIndex={500_000}>
          <DialogOverlay
            key="overlay"
            bg="$background08"
            onPress={(e) => {
              props.onOpenChange?.(false)
              e.stopPropagation()
              e.preventDefault()
            }}
          >
            <YStack
              fullscreen
              $theme-dark={{
                bg: '$color2',
              }}
              $theme-light={{
                bg: '$shadow6',
              }}
              opacity={0.4}
            />
          </DialogOverlay>

          <DialogContent
            data-tauri-drag-region
            ref={dialogContentRef}
            minH={minH}
            minW={minW}
            key="content"
            rounded={CONTENT_RADIUS}
            overflow="hidden"
          >
            <YStack
              z={-1}
              fullscreen
              bg="$color1"
              opacity={0.24}
              rounded={CONTENT_RADIUS}
              pointerEvents="none"
            />
            <YStack
              z={-1}
              fullscreen
              borderTopWidth={0.5}
              borderColor="$white"
              opacity={0.1}
              $theme-light={{
                opacity: 0.8,
              }}
              rounded={CONTENT_RADIUS}
              pointerEvents="none"
            />
            <YStack
              z={-1}
              fullscreen
              opacity={0.2}
              rounded={CONTENT_RADIUS}
              shadowColor="$shadow6"
              shadowRadius={40}
              shadowOffset={{ height: 20, width: 0 }}
              pointerEvents="none"
            />

            {children}
          </DialogContent>
        </TamaguiDialog.Portal>
      </TamaguiDialog>
    </DialogOpenContext.Provider>
  )
}

const DialogOverlay = styled(TamaguiDialog.Overlay, {
  animation: animationClamped('quickerLessBouncy'),
  opacity: 1,
  backdropFilter: 'blur(3px)',
  enterStyle: { opacity: 0 },
  exitStyle: { opacity: 0 },
})

const DialogContent = styled(TamaguiDialog.Content, {
  unstyled: true,
  z: 1000000,
  animation: animationClamped('quickerLessBouncy'),
  bg: 'transparent',
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
    <YStack pointerEvents="box-none" gap="$3" mb="$3">
      <DialogTitle
        size="$6"
        fontWeight="600"
        pointerEvents="none"
        cursor="default"
        select="none"
      >
        {title}
      </DialogTitle>
      <DialogDescription pointerEvents="none" select="none" size="$4" color="$color10">
        {description}
      </DialogDescription>
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
      <Spacer flex />
      <YStack data-tauri-drag-region gap="$3">
        <Separator opacity={0.5} />
        <XStack data-tauri-drag-region justify="flex-end" gap="$2">
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
