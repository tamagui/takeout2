import { Alert } from 'react-native'
import { useQuery, zero } from '~/zero/client'
import { useUser } from '~/features/user/useUser'
import { showToast } from '~/interface/toast/helpers'
import { analytics } from '~/features/analytics/analytics'

export const useFollow = (targetUserId: string | undefined, targetUsername?: string) => {
  const { user: currentUser } = useUser()

  // check if current user follows the target user
  const [followRelation, status] = useQuery(
    zero.query.follows
      .where('followerId', currentUser?.id || '')
      .where('followingId', targetUserId || '')
      .one(),
    {
      enabled: Boolean(
        currentUser?.id && targetUserId && currentUser.id !== targetUserId
      ),
    }
  )

  const isFollowing = Boolean(followRelation)

  const handleUnfollow = async () => {
    try {
      await zero.mutate.follows.unfollow(targetUserId!)

      // log analytics for unfollow action
      analytics.track('feature_used', {
        featureName: 'user_unfollowed',
        context: 'profile',
      })

      const message = targetUsername
        ? `Unfollowed @${targetUsername}`
        : 'Unfollowed successfully'
      showToast(message, { type: 'success' })
    } catch (error) {
      console.error('Error unfollowing:', error)
      showToast('Failed to unfollow', { type: 'error' })
    }
  }

  const handleFollow = async () => {
    try {
      await zero.mutate.follows.follow(targetUserId!)

      // log analytics for follow action
      analytics.track('user_followed', {
        followedUserId: targetUserId!,
      })

      const message = targetUsername
        ? `Following @${targetUsername}`
        : 'Followed successfully'
      showToast(message, { type: 'success' })
    } catch (error) {
      console.error('Error following:', error)
      showToast('Failed to follow', { type: 'error' })
    }
  }

  const toggleFollow = async () => {
    if (!currentUser?.id || !targetUserId) return
    if (currentUser.id === targetUserId) return // can't follow yourself

    if (isFollowing) {
      // show confirmation alert for unfollow
      const username = targetUsername ? `@${targetUsername}` : 'this user'
      Alert.alert(
        'Unfollow',
        `Are you sure you want to unfollow ${username}?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Unfollow',
            style: 'destructive',
            onPress: handleUnfollow,
          },
        ],
        { cancelable: true }
      )
    } else {
      // follow directly without confirmation
      handleFollow()
    }
  }

  return {
    isFollowing,
    toggleFollow,
    isLoading: status.type === 'unknown',
  }
}
