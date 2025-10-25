import { useAnalytics } from '~/statsig/useAnalytics'
import { useQuery, zero } from '~/zero/client'

export const useLike = (userId: string | undefined, postId: string | undefined) => {
  const analytics = useAnalytics()
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

    // use the new atomic toggle mutation
    await zero.mutate.like.toggle({
      userId,
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
