import { useAuth } from '~/auth/client/authClient'
import { useQuery, zero } from '~/zero/client'
import { isUserOnline } from './isUserOnline'

export const useUser = () => {
  const auth = useAuth()
  const userId = auth.user?.id || ''

  const [user, status] = useQuery(
    zero.query.userPublic
      .where('id', userId)
      .one()
      // TODO we should just store userServerId on user
      .related('server', (q) =>
        q.where('userId', userId).where('isPrivateChat', false).one()
      )
      .related('servers', (q) =>
        q.where('isPrivateChat', '!=', true).where('userId', 'IS', null)
      ),
    {
      enabled: !!userId,
    }
  )

  return {
    ...auth,
    user,
    // TODO
    isAdmin: user?.username === 'nate' || user?.username === 'admin',
    isLoading: status.type === 'unknown',
    isOnline: user ? isUserOnline(user) : null,
  }
}
