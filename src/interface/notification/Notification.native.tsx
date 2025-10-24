import type { ToastShowOptions } from '../toast/types'

export const NotificationProvider = ({ children }: { children: any }) => {
  return children
}

export const showNotification = (_title: string, _options?: ToastShowOptions) => {}

export const hideNotification = () => {}
