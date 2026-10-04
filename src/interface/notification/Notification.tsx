import { toast } from '@tamagui/toast'
import type { ReactNode } from 'react'

import { useNotificationListener } from '~/features/notification/useNotificationListener'

import { useNativePushListeners } from './useNativePushListeners'

import type { ToastOptions } from '../toast/types'

export type { ToastOptions }

export const showNotification = (
  title: string,
  options: {
    description?: string
    display?: 'error' | 'warn' | 'info'
    action?: { label: string; onPress: () => void | Promise<void> }
    exclusiveKey?: string
    toastOptions?: { duration?: number }
  } = {},
) => {
  const { display, description, action, toastOptions } = options

  const fn =
    display === 'error' ? toast.error : display === 'warn' ? toast.warning : toast.info

  return fn(title, {
    description,
    duration: toastOptions?.duration,
    action: action
      ? {
          label: action.label,
          onClick: () => action.onPress(),
        }
      : undefined,
  })
}

export const hideNotification = (id?: string | number) => {
  toast.dismiss(id)
}

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  useNotificationListener()
  useNativePushListeners()
  return <>{children}</>
}
