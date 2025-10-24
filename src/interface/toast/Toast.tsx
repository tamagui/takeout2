import {
  ToastProvider as TamaguiToastProvider,
  Toast,
  ToastViewport,
  useToastController,
  useToastState,
} from '@tamagui/toast'
import { useState } from 'react'
import { YStack } from 'tamagui'
import { createEmitter, useEmitter } from '@vxrn/helpers'
import { Z_INDICES } from '../constants'
import type { ToastShowOptions } from './types'

export type ToastType = 'error' | 'warn' | 'info'
type ToastOptions = ToastShowOptions & {
  type?: ToastType
}

const toastEmitter = createEmitter<
  { type: 'show'; title: string; options: ToastOptions } | { type: 'hide' }
>('toast', {
  type: 'hide',
})

let toastType: ToastType = 'info'

export const showToast = (
  title: string,
  { type = 'info', ...options }: ToastOptions = {}
) => {
  toastEmitter.emit({ type: 'show', title, options })
  toastType = type
}

export const hideToast = () => {
  toastEmitter.emit({ type: 'hide' })
}

export const ToastProvider = ({ children }: { children: any }) => {
  return (
    <TamaguiToastProvider swipeDirection="horizontal">
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

  useEmitter(toastEmitter, (val) => {
    if (val.type === 'hide') {
      controller.hide()
    } else {
      if (currentToast) {
      }
      controller.show(val.title, val.options)
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
      themeInverse
      bg="$color2"
      py="$1.5"
      px="$3"
      theme={toastType === 'error' ? 'red' : toastType === 'warn' ? 'yellow' : null}
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
