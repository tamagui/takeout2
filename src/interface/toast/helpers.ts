import { toast } from '@tamagui/toast/v2'

import type { ToastOptions } from './types'

function mapTypeToToastMethod(type: ToastOptions['type']) {
  switch (type) {
    case 'error':
      return toast.error
    case 'warn':
      return toast.warning
    case 'success':
      return toast.success
    case 'info':
      return toast.info
    case undefined:
      return toast
  }
}

export const showToast = (title: string, options: ToastOptions = {}) => {
  const { type, message, description, duration, action } = options
  const fn = mapTypeToToastMethod(type)

  return fn(title, {
    description: description || message,
    duration,
    action: action
      ? {
          label: action.label,
          onClick: action.onPress,
        }
      : undefined,
  })
}

export const hideToast = (id?: string | number) => {
  toast.dismiss(id)
}
