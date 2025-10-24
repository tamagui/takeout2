import { useQuery, zero } from '~/zero/client'

export const useFriendship = (userA: { id: string }, userB?: { id: string } | null) => {
  const [friendships] = useQuery(
    zero.query.friendship
      .where('requestingId', userA.id)
      .where('acceptingId', userB?.id || '')
  )
  const [friendship] = friendships
  const status = !friendship
    ? 'not-friend'
    : !friendship.accepted
      ? 'requested'
      : 'accepted'
  return [friendship, status] as const
}
