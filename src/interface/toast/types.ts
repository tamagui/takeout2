import type { useToastController } from '@tamagui/toast'

export type ToastController = ReturnType<typeof useToastController>
export type ToastShowOptions = ToastController['show'] extends (a: any, b: infer B) => any
  ? B
  : never

export type ToastType = 'error' | 'warn' | 'info' | 'success'

export type ToastOptions = ToastShowOptions & {
  type?: ToastType
}
