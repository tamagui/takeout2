import type { UserWithProfile } from '~/data/types'

export const isUserOnline = (user: UserWithProfile) => {
  return user?.state?.onlineStatus === 'online'
}
