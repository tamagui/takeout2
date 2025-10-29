import type { UserWithStats } from '~/data/types'

export const isUserOnline = (user: UserWithStats) => {
  return user?.state?.onlineStatus === 'online'
}
