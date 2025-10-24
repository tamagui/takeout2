import type { UserWithState } from '~/data/types'

const INACTIVE_AFTER = 1000 * 60 * 10

export const isUserOnline = (user: UserWithState) => {
  return (user?.lastActive || 0) > Date.now() - INACTIVE_AFTER
}
