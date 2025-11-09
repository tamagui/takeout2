import { ensure } from '@vxrn/helpers'
import { userById } from '~/data/queries/user'
import type { User } from '~/data/types'
import { useAuth } from '~/features/auth/client/authClient'
import { useQuery, zero } from '~/zero/client'
import { isUserOnline } from './isUserOnline'

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

  // detailed logging for debugging zero query issues
  console.info(`[useUser] Query status:`, {
    platform: typeof window !== 'undefined' ? 'web' : 'native',
    auth: {
      hasAuthUser: !!auth.user,
      authUserId: auth.user?.id,
      hasToken: !!auth.token,
    },
    query: {
      userId,
      enabled: !!userId,
      status: status.type,
      hasUser: !!user,
      userData: user ? { id: user.id, username: user.username, hasOnboarded: user.hasOnboarded } : null,
    },
    error: status.type === 'error' ? status : null,
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
