import { createEmitter } from '@take-out/helpers'

import type { ToastShowOptions } from '~/interface/toast/types'

export type NotificationDisplay = 'error' | 'warn' | 'info'

export type NotificationAction = {
  label: string
  onPress: () => void | Promise<void>
}

export type NotificationI = {
  id: string
  title: string
  description?: string
  exclusiveKey?: string
  display: NotificationDisplay
  action?: NotificationAction
  toastOptions?: ToastShowOptions
}

export const notificationEmitter = createEmitter<
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
  { display = 'info', ...options }: Partial<Omit<NotificationI, 'title' | 'id'>> = {}
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
