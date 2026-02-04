export { useNotificationStatus } from './useNotificationsStatus'
export {
  useNotificationPromptFlow,
  markNotificationPromptSeen,
} from './useNotificationPromptFlow'

export { notificationPromptStorage } from './notificationPromptStorage'

export { isPermissionsGranted } from './isPermissionsGranted'
export { registerForPushNotificationsAsync } from './registerForPushNotificationsAsync'
export { registerDevice, disableDevicePush } from './registerDevice'

export type {
  InAppNotification,
  NotificationCardProps,
  NotificationItem,
  NotificationListItemProps,
  NotificationType,
} from './types'
