import { ensure } from '@vxrn/helpers'
import { useAuth } from '~/auth/client/authClient'
import type { User } from '~/data/models'
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

    update: (next: Partial<User>) => {
      ensure(user, 'no user')
      return zero.mutate.userPublic.update({
        id: user.id,
        ...next,
      })
    },

    // TODO
    isAdmin: user?.username === 'nate' || user?.username === 'admin',
    isLoading: status.type === 'unknown',
    isOnline: user ? isUserOnline(user) : null,
  }
}
