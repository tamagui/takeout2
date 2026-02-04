export type NotificationItem = {
  id: string
  avatar: string
  name: string
  message: string
  time: string
}

export type NotificationCardProps = {
  notification: NotificationItem
  index: number
  isSpread: boolean
  totalCount: number
}

export type NotificationType = 'comment' | 'system'

export type InAppNotification = {
  id: string
  userId: string
  actorId?: string
  type: NotificationType
  title: string
  body?: string
  postId?: string
  commentId?: string
  read: boolean
  pushSent: boolean
  createdAt: number
}

export type NotificationListItemProps = {
  notification: InAppNotification
  onPress?: (notification: InAppNotification) => void
  onMarkRead?: (notificationId: string) => void
}
