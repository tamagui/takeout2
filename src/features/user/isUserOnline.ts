import type { UserWithState } from '~/data/types'

export const isUserOnline = (user: UserWithState) => {
  return user?.state?.onlineStatus === 'online'
}
