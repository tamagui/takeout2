import { ensure } from '@take-out/helpers'

import { userById } from '~/data/queries/user'
import { useAuth } from '~/features/auth/client/authClient'
import { useQuery, zero } from '~/zero/client'

import type { User } from '~/data/types'

export const useUser = () => {
  const auth = useAuth()
  const userId = auth.user?.id || ''

  const [user, status] = useQuery(
    userById,
    { userId },
    {
      enabled: !!userId,
    }
  )

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
    isOnline: null, // TODO: implement isUserOnline logic
  }
}
