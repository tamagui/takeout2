import { useAuth } from '~/auth/client/authClient'
import { useQuery, zero } from '~/zero/client'
import { isUserOnline } from './isUserOnline'

export const useUser = () => {
  const auth = useAuth()
  const userId = auth.user?.id || ''

  const [user, status] = useQuery(zero.query.userPublic.where('id', userId).one(), {
    enabled: !!userId,
  })

  return {
    ...auth,
    user,
    // TODO
    isAdmin: user?.username === 'nate' || user?.username === 'admin',
    isLoading: status.type === 'unknown',
    isOnline: user ? isUserOnline(user) : null,
  }
}
