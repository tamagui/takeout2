import { isWeb, useEmitter, useEmitterValue } from '@take-out/helpers'
import {
  ToastProvider as TamaguiToastProvider,
  Toast,
  ToastViewport,
  useToastController,
  useToastState,
} from '@tamagui/toast'
import { useState, type ReactNode } from 'react'
import { YStack } from 'tamagui'

import { Z_INDICES } from '../constants'
import { toastEmitter } from './emitter'

// Re-export from helpers for convenience
export { showToast } from './helpers'

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  return (
    <TamaguiToastProvider native={!isWeb} swipeDirection="horizontal">
      <ToastDisplay />

      <ToastViewport
        portalToRoot
        z={Z_INDICES.toast}
        flexDirection="column-reverse"
        top={0}
        left={0}
        right={0}
        mx="auto"
      />
      {children}
    </TamaguiToastProvider>
  )
}

const ToastDisplay = () => {
  const currentToast = useToastState()
  const nextDuration = currentToast?.duration || 3000
  const [duration, setDuration] = useState(nextDuration)
  if (duration !== nextDuration) {
    setDuration(nextDuration)
  }

  const controller = useToastController()

  const toast = useEmitterValue(toastEmitter)
  const toastType = toast.type === 'show' ? toast.toast.type : null

  useEmitter(toastEmitter, (val) => {
    if (val.type === 'hide') {
      controller.hide()
    } else {
      const { toast } = val
      controller.show(toast.title, toast.options)
    }
  })

  if (currentToast?.isHandledNatively) {
    return null
  }

  if (!currentToast) {
    return null
  }

  return (
    <Toast
      key={currentToast?.id}
      duration={duration}
      enterStyle={{ opacity: 0, scale: 1, y: 0 }}
      exitStyle={{ opacity: 0, scale: 1, y: 0 }}
      y={20}
      opacity={1}
      scale={1}
      animation="quick"
      maxW={250}
      overflow="hidden"
      viewportName={currentToast?.viewportName}
      bg="$color2"
      py="$1.5"
      px="$3"
      theme={
        toastType === 'error'
          ? 'red'
          : toastType === 'warn'
            ? 'yellow'
            : toastType === 'success'
              ? 'green'
              : null
      }
      shadowColor="$shadow1"
      shadowRadius={20}
      shadowOffset={{ height: 10, width: 0 }}
      rounded="$8"
    >
      <YStack>
        <Toast.Title ellipse size="$3" color="$color12">
          {currentToast?.title ?? ''}
        </Toast.Title>
        {!!currentToast?.message && (
          <Toast.Description size="$2" color="$color1">
            {currentToast.message}
          </Toast.Description>
        )}
      </YStack>
    </Toast>
  )
}
