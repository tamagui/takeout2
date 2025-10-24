import { useUser } from '~/features/user/useUser'
import { useQuery, zero } from '~/zero/client'

/**
 * Hook to fetch servers that the current user is a member of
 * Returns all public servers where the user has membership
 */
export const useUserServers = () => {
  const { user } = useUser()

  const [servers, status] = useQuery(
    (() => {
      let query = zero.query.server.where('userId', 'IS', null).limit(20)

      if (user?.id) {
        query = query.related('member', (q) => q.where('id', user.id).one())
      }

      return query
    })()
  )

  // Filter to only servers where user is a member
  const userServers = servers.filter((s) => (s as any).member)

  return {
    servers: userServers,
    allServers: servers,
    isLoading: status.type === 'unknown',
    isEmpty: userServers.length === 0,
  }
}
