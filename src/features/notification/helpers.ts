import type { Notification } from '~/data/types'

export const isMessageNotification = (
  notification: Notification
): notification is Notification & {
  type: 'message'
  channelId: string
  serverId: string
  messageId: string
} => {
  return (
    notification.type === 'message' &&
    typeof notification.channelId === 'string' &&
    typeof notification.serverId === 'string' &&
    typeof notification.messageId === 'string'
  )
}

export const isFriendshipNotification = (
  notification: Notification
): notification is Notification & {
  type: 'friendship'
} => {
  return notification.type === 'friendship'
}
