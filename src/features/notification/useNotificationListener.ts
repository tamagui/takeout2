import { useEffect, useRef } from 'react'

import { newNotificationsSince } from '~/data/queries/notification'
import { useAuth } from '~/features/auth/client/authClient'
import { useQuery } from '~/zero/client'

import { showNotification } from './notificationEmitter'

export const useNotificationListener = () => {
  const { user } = useAuth()
  const mountTimeRef = useRef(Date.now())
  const seenIdsRef = useRef<Set<string>>(new Set())

  const [notifications] = useQuery(
    newNotificationsSince,
    { userId: user?.id ?? '', sinceTime: mountTimeRef.current },
    { enabled: Boolean(user?.id) }
  )

  useEffect(() => {
    if (!notifications) return

    for (const notification of notifications) {
      if (seenIdsRef.current.has(notification.id)) continue
      seenIdsRef.current.add(notification.id)

      showNotification('New notification', {
        description: notification.body ?? undefined,
        toastOptions: { duration: 3000 },
      })
    }
  }, [notifications])
}
