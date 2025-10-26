import { useQuery, zero } from '~/zero/client'
import { analytics } from '~/features/analytics/analytics'

export const useLike = (userId: string | undefined, postId: string | undefined) => {
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

    // log analytics for like action
    analytics.track('post_liked', {
      postId,
      action: hasLiked ? 'unliked' : 'liked',
    })
  }

  return {
    hasLiked,
    userLike,
    toggleLike,
    status,
  }
}
