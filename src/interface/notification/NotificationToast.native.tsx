import type { ToastShowOptions } from '../toast/types'

export const NotificationToastProvider = ({ children }: { children: any }) => {
  return children
}

export const showNotificationToast = (_title: string, _options?: ToastShowOptions) => {}

export const hideNotificationToast = () => {}
