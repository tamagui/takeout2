import {
  unreadNotificationCount,
  unreadNotifications,
  userNotifications,
} from '~/data/queries/notification'
import { useQuery } from '~/zero/client'

export const useNotifications = (userId: string, pageSize?: number) => {
  const [data, status] = useQuery(
    userNotifications,
    { userId, pageSize },
    { enabled: Boolean(userId) }
  )

  return { notifications: data, status }
}

export const useUnreadNotifications = (userId: string) => {
  const [data, status] = useQuery(
    unreadNotifications,
    { userId },
    { enabled: Boolean(userId) }
  )

  return { notifications: data, status }
}

export const useUnreadNotificationCount = (userId: string) => {
  const [notifications] = useQuery(
    unreadNotificationCount,
    { userId },
    { enabled: Boolean(userId) }
  )

  return notifications?.length ?? 0
}
