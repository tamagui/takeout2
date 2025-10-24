import { zero } from '~/zero/client'
import type { Friendship } from '~/data/types'

export const removeFriendship = async (friendship: Friendship) => {
  await Promise.all([
    zero.mutate.friendship.delete(friendship),
    // delete the opposite one too
    zero.mutate.friendship.delete({
      requestingId: friendship.acceptingId,
      acceptingId: friendship.requestingId,
    }),
  ])
}
