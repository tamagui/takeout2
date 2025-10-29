import { useQuery, zero } from '~/zero/client'

export const useLike = (
  userId: string | undefined,
  postId: string | undefined,
  authorId?: string
) => {
  const [likes, status] = useQuery(
    zero.query.like
      .where('userId', userId || '')
      .where('postId', postId || '')
      .limit(1),
    {
      enabled: Boolean(userId && postId),
    }
  )

  const userLike = likes?.[0] || null
  const hasLiked = Boolean(userLike)

  const toggleLike = async () => {
    if (!userId || !postId) return

    await zero.mutate.like.toggle({
      postId,
    }).client
  }

  return {
    hasLiked,
    userLike,
    toggleLike,
    status,
  }
}
