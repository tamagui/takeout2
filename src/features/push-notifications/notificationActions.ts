import { sendPushNotificationForNotification } from './server/actions/sendPushNotificationForNotification'

export const notificationActions = {
  sendPushNotificationForNotification,
} as const

export type NotificationActions = typeof notificationActions
