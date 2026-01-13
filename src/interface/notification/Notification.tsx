import { createEmitter, useEmitter } from '@take-out/helpers'
import { Toast, ToastViewport } from '@tamagui/toast'
import { useState } from 'react'
import { AnimatePresence, XStack, YStack } from 'tamagui'

import { ButtonSimple } from '../buttons/ButtonSimple'
import { Z_INDICES } from '../constants'
import Glint from '../effects/Glint'

import type { ToastShowOptions } from '../toast/types'

const MESSAGE_LIST_BOTTOM_PAD = 92

export type NotificationDisplay = 'error' | 'warn' | 'info'

export type NotificationAction = {
  label: string
  onPress: () => void | Promise<void>
}

type NotificationI = {
  id: string
  title: string
  description?: string
  exclusiveKey?: string
  display: NotificationDisplay
  action?: NotificationAction
  toastOptions?: ToastShowOptions
  // progress?: number
}

const notificationEmitter = createEmitter<
  | ({
      type: 'show'
    } & Omit<NotificationI, 'id'>)
  | { type: 'hide'; id: string }
  | { type: 'hide_all' }
>('notification', {
  type: 'hide_all',
})

export const showNotification = (
  title: string,
  { display = 'info', ...options }: Omit<NotificationI, 'title' | 'id'> = {
    display: 'info',
  }
) => {
  notificationEmitter.emit({
    type: 'show',
    title,
    display,
    ...options,
    toastOptions: {
      ...options.toastOptions,
      viewportName: 'notifications',
    },
  })
}

export const hideNotification = (id: string) => {
  notificationEmitter.emit({ type: 'hide', id })
}

// TODO: we likely want to use either zero or jotai for this and have the list stored in a store

// export const updateNotification = (id: string, update: Partial<NotificationI>) => {
//   notificationEmitter.emit
// }

export const NotificationProvider = ({ children }: { children: any }) => {
  return (
    <>
      <NotificationDisplay />
      <ToastViewport
        multipleToasts
        name="notification"
        portalToRoot
        z={Z_INDICES.toast}
        flexDirection="column"
        bottom={0}
        right={10}
        width="auto"
      />
      {children}
    </>
  )
}

const NotificationDisplay = () => {
  const [items, setItems] = useState<NotificationI[]>([])

  useEmitter(notificationEmitter, (val) => {
    if (val.type === 'show') {
      const id = `notif-${Math.random()}`
      setItems((prev) => {
        if (val.exclusiveKey && prev.some((x) => x.exclusiveKey === val.exclusiveKey)) {
          return prev
        }

        return [...prev, { ...val, id }]
      })
    }
    if (val.type === 'hide') {
      setItems((prev) => prev.filter((item) => item.id !== val.id))
    }
    if (val.type === 'hide_all') {
      setItems([])
    }
  })

  if (!items.length) {
    return null
  }

  return (
    <AnimatePresence>
      {items.map((item, index) => (
        <NotificationToast
          key={item.id}
          item={item}
          total={items.length}
          position={items.length - index}
          index={index}
        />
      ))}
    </AnimatePresence>
  )
}

const NotificationToast = ({
  item,
  total,
  position,
  index,
}: {
  total: number
  item: NotificationI
  position: number
  index: number
}) => {
  const { title, description, action, id, display } = item
  const duration = item.toastOptions?.duration || Number.POSITIVE_INFINITY
  const isFullyHidden = total - position > 5

  return (
    <Toast
      key={item.id}
      duration={duration}
      viewportName="notification"
      unstyled
      z={position}
    >
      <YStack
        transition="quick"
        enterStyle={{ opacity: 0, scale: 1, y: -10 }}
        exitStyle={{ opacity: 0, scale: 1, y: -10 }}
        width={280}
        opacity={isFullyHidden ? 0 : 1}
        display={isFullyHidden ? 'none' : 'flex'}
        position="absolute"
        b={0}
        r={10}
        y={-index * 10 - MESSAGE_LIST_BOTTOM_PAD}
        scale={1}
        bg="$background06"
        backdropFilter="blur(30px)"
        py="$3"
        px="$3"
        theme={display === 'error' ? 'red' : display === 'warn' ? 'yellow' : undefined}
        shadowColor="$shadow3"
        shadowRadius={10}
        shadowOffset={{ height: 10, width: 0 }}
        flex={1}
        gap="$3"
        rounded="$5"
      >
        <Glint borderTopLeftRadius="$5" borderTopRightRadius="$5" />

        <YStack gap="$1.5">
          <Toast.Title size="$4" color="$color12">
            {title}
          </Toast.Title>

          {!!description && (
            <Toast.Description size="$2" color="$color11">
              {description}
            </Toast.Description>
          )}
        </YStack>

        <XStack gap="$2" self="flex-end">
          {action && (
            <ButtonSimple
              size="small"
              onPress={() => {
                action.onPress()
                hideNotification(id)
              }}
            >
              {action.label}
            </ButtonSimple>
          )}

          <ButtonSimple size="small" onPress={() => hideNotification(id)}>
            Close
          </ButtonSimple>
        </XStack>
      </YStack>
    </Toast>
  )
}
