import { useCurrentServerId } from '~/context/CurrentServerContext'
import { queryMessageItemRelations } from '~/features/message/queryMessageItemRelations'
import { useUser } from '~/features/user/useUser'
import { useQuery, zero } from '~/zero/client'
import type { NotificationMessageWithRelations } from '~/data/types'

export const useLatestNotifications = () => {
  const serverId = useCurrentServerId()
  const { user } = useUser()
  const enabled = Boolean(serverId && user?.id)

  // Query notifications for current user that haven't been seen
  const [notifications, { type }] = useQuery(
    zero.query.notification
      .where('userId', user?.id || '')
      .where('serverId', serverId)
      .where('messageId', 'IS NOT', null)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .related('messages', (q) =>
        // TODO support one() relationships in queryMessageItemRelations
        queryMessageItemRelations(q, serverId).limit(1)
      ),
    {
      enabled,
    }
  )

  return {
    notifications: notifications as NotificationMessageWithRelations[],
    isLoading: !enabled ? true : type !== 'complete',
  }
}
