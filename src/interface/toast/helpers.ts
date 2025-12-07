import { toastEmitter } from './emitter'

import type { ToastOptions } from './types'

export const showToast = (title: string, toast: ToastOptions = {}) => {
  toastEmitter.emit({ type: 'show', toast: { title, ...toast } })
}

export const hideToast = () => {
  toastEmitter.emit({ type: 'hide' })
}
