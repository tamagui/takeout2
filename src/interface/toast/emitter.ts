import { createEmitter } from '@tamatko/helpers'
import type { ToastOptions } from './types'

export const toastEmitter = createEmitter<
  { type: 'show'; toast: ToastOptions } | { type: 'hide' }
>('toast', {
  type: 'hide',
})
