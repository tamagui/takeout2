import { createEmitter, useEmitter } from '@take-out/helpers'
import { Toast, ToastViewport } from '@tamagui/toast'
import { useEffect, useState } from 'react'
import { AnimatePresence, XStack, YStack } from 'tamagui'

import { ButtonAction } from '../buttons/ButtonAction'
import { ButtonSimple } from '../buttons/ButtonSimple'
import { Z_INDICES } from '../constants'
import Glint from '../effects/Glint'

import type { ToastShowOptions } from '../toast/types'

const MESSAGE_LIST_BOTTOM_PAD = 92

export type NotificationToastDisplay = 'error' | 'warn' | 'info'

export type NotificationToastAction = {
  label: string
  onPress: () => void | Promise<void>
}

type NotificationToastI = {
  id: string
  title: string
  description?: string
  exclusiveKey?: string
  display: NotificationToastDisplay
  action?: NotificationToastAction
  toastOptions?: ToastShowOptions
  // progress?: number
}

const notificationToastEmitter = createEmitter<
  | { type: 'show'; item: NotificationToastI }
  | { type: 'hide'; id: string }
  | { type: 'hide_all' }
>('notification-toast', {
  type: 'hide_all',
})

const queue: NotificationToastI[] = []
let mounted = false

export const showNotificationToast = (
  title: string,
  { display = 'info', ...options }: Omit<NotificationToastI, 'title' | 'id'> = {
    display: 'info',
  }
) => {
  const item: NotificationToastI = {
    id: `${Math.random()}`,
    title,
    display,
    ...options,
    toastOptions: {
      ...options.toastOptions,
      viewportName: 'notifications',
    },
  }

  if (!mounted) {
    queue.push(item)
  } else {
    notificationToastEmitter.emit({
      type: 'show',
      item,
    })
  }
}

export const hideNotificationToast = (id: string) => {
  notificationToastEmitter.emit({ type: 'hide', id })
}

// TODO: we likely want to use either zero or jotai for this and have the list stored in a store

// export const updateNotificationToast = (id: string, update: Partial<NotificationToastI>) => {
//   notificationToastEmitter.emit
// }

export const NotificationToastProvider = ({ children }: { children: any }) => {
  return (
    <>
      <NotificationToastDisplay />
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

const NotificationToastDisplay = () => {
  const [items, setItems] = useState<NotificationToastI[]>([])

  useEffect(() => {
    if (!mounted) {
      mounted = true
      if (queue.length) {
        setItems(queue)
      }
    }
  }, [])

  useEmitter(notificationToastEmitter, (val) => {
    if (val.type === 'show') {
      setItems((prev) => {
        if (
          val.item.exclusiveKey &&
          prev.some((x) => x.exclusiveKey === val.item.exclusiveKey)
        ) {
          return prev
        }
        return [...prev, val.item]
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
        <NotificationToastItem
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

const NotificationToastItem = ({
  item,
  total,
  position,
  index,
}: {
  total: number
  item: NotificationToastI
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
        animation="quick"
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
            <Toast.Description size="$2" color="$color11" ellipse numberOfLines={5}>
              {description}
            </Toast.Description>
          )}
        </YStack>

        <XStack gap="$2" self="flex-end">
          {action && (
            <ButtonSimple
              size="tiny"
              onPress={() => {
                action.onPress()
                hideNotificationToast(id)
              }}
            >
              {action.label}
            </ButtonSimple>
          )}

          <ButtonAction size="small" onPress={() => hideNotificationToast(id)}>
            Close
          </ButtonAction>
        </XStack>
      </YStack>
    </Toast>
  )
}
