import { zql } from 'on-zero'

export const userNotifications = (props: { userId: string; pageSize?: number }) => {
  return zql.notification
    .where('userId', props.userId)
    .orderBy('createdAt', 'desc')
    .limit(props.pageSize || 50)
    .related('actor', (q) => q.one())
}

export const unreadNotifications = (props: { userId: string }) => {
  return zql.notification
    .where('userId', props.userId)
    .where('read', false)
    .orderBy('createdAt', 'desc')
    .related('actor', (q) => q.one())
}

export const unreadNotificationCount = (props: { userId: string }) => {
  return zql.notification.where('userId', props.userId).where('read', false)
}
