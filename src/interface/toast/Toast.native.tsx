import { ToastProvider as TamaguiToastProvider, useToastController } from '@tamagui/toast'
import { createEmitter, useEmitter } from '@vxrn/helpers'
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

export const showToast = (
  title: string,
  { type = 'info', ...options }: ToastOptions = {}
) => {
  toastEmitter.emit({ type: 'show', title, options: { type, ...options } })
}

export const hideToast = () => {
  toastEmitter.emit({ type: 'hide' })
}

export const ToastProvider = ({ children }: { children: any }) => {
  return (
    <TamaguiToastProvider>
      <ToastController />
      {children}
    </TamaguiToastProvider>
  )
}

// Component to manage the toast controller
const ToastController = () => {
  const controller = useToastController()

  useEmitter(toastEmitter, (val) => {
    if (val.type === 'hide') {
      controller.hide()
    } else {
      // Always use native toasts on mobile via burnt
      controller.show(val.title, {
        message: val.options.message,
        duration: val.options.duration || 3000,
        native: true, // This tells Tamagui to use burnt for native toasts
        // Burnt will handle the preset and haptic based on the content
      })
    }
  })

  return null
}

// Helper functions for convenience
export const showSuccessToast = (title: string, message?: string) => {
  showToast(title, { type: 'info', message } as any)
}

export const showErrorToast = (title: string, message?: string) => {
  showToast(title, { type: 'error', message } as any)
}

export const showWarningToast = (title: string, message?: string) => {
  showToast(title, { type: 'warn', message } as any)
}
