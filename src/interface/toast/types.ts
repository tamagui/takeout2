import type { useToastController } from '@tamagui/toast'
import type { ReactNode } from 'react'

export type ToastController = ReturnType<typeof useToastController>
export type ToastShowOptions = ToastController['show'] extends (a: any, b: infer B) => any
  ? B
  : never

export type ToastType = 'error' | 'warn' | 'info' | 'success'

export type ToastAction = {
  label: string
  onPress: () => void
}

export type ToastOptions = ToastShowOptions & {
  type?: ToastType
  expandedChild?: ReactNode
  action?: ToastAction
}

export interface ToastData extends ToastOptions {
  title?: string
  id?: number
}
