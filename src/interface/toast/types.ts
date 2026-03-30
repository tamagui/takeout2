import type { ReactNode } from 'react'

export type ToastType = 'error' | 'warn' | 'info' | 'success'

export type ToastAction = {
  label: string
  onPress: () => void
}

export type ToastOptions = {
  type?: ToastType
  message?: string
  description?: string
  duration?: number
  action?: ToastAction
  expandedChild?: ReactNode
  haptic?: 'success' | 'warning' | 'error'
}
