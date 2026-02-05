import { useEmitter } from '@take-out/helpers'
import { Toast, ToastViewport } from '@tamagui/toast'
import { useState } from 'react'
import { AnimatePresence, XStack, YStack } from 'tamagui'

import {
  hideNotification,
  notificationEmitter,
  showNotification,
  type NotificationAction,
  type NotificationDisplay,
  type NotificationI,
} from '~/features/notification/notificationEmitter'
import { useNotificationListener } from '~/features/notification/useNotificationListener'

import { Button } from '../buttons/Button'
import { Z_INDICES } from '../constants'
import Glint from '../effects/Glint'

export {
  hideNotification,
  showNotification,
  type NotificationAction,
  type NotificationDisplay,
}

const MESSAGE_LIST_BOTTOM_PAD = 92

export const NotificationProvider = ({ children }: { children: any }) => {
  useNotificationListener()

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
        transition="200ms"
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
          <Toast.Title size="$4" color="$color12" fontWeight="600">
            {title}
          </Toast.Title>

          {!!description && (
            <Toast.Description size="$2" color="$color11">
              {description}
            </Toast.Description>
          )}
        </YStack>

        {action && (
          <XStack gap="$2" self="flex-end">
            <Button
              size="small"
              onPress={() => {
                action.onPress()
                hideNotification(id)
              }}
            >
              {action.label}
            </Button>
          </XStack>
        )}
      </YStack>
    </Toast>
  )
}
