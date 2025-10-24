import { useMemo } from 'react'
import { useUser } from '~/features/user/useUser'
import type { User } from '~/data/types'
import { useQuery, zero } from '~/zero/client'

export const useFriends = () => {
  const { user } = useUser()
  const [all] = useQuery(
    zero.query.userPublic
      .where('id', user?.id || '')
      .related('friends')
      .related('friendships')
      .one(),
    !!user?.id
  )

  const friends = useMemo(() => {
    const res: User[] = []
    const addedIds = new Set<string>()

    if (all) {
      for (const friendship of all.friendships) {
        if (friendship.accepted && !addedIds.has(friendship.acceptingId)) {
          const friend = all.friends.find((x) => x.id === friendship.acceptingId)
          if (friend) {
            addedIds.add(friend.id)
            res.push(friend)
          }
        }
      }
    }

    return res
  }, [all])

  return friends
}
