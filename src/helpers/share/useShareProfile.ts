import { useCallback } from 'react'
import { Share, Platform } from 'react-native'
import type { User } from '~/data/types'
import { showToast } from '~/interface/toast/helpers'

export function useShareProfile() {
  const shareProfile = useCallback(async (user: User, publicProfileUrl: string) => {
    try {
      if (Platform.OS === 'web') {
        // Web: copy to clipboard
        await navigator.clipboard.writeText(publicProfileUrl)
        showToast('Profile link copied to clipboard!', { type: 'success' })
      } else {
        // Native: use share sheet
        await Share.share({
          message: `Check out @${user.username || user.name} on our app!`,
          url: publicProfileUrl,
        })
      }

      // Analytics event removed - 'profile_shared' not in event types
      // analytics.track('profile_shared', {
      //   targetUserId: user.id,
      //   platform: Platform.OS,
      // })
    } catch (error) {
      console.error('Error sharing profile:', error)
      showToast('Failed to share profile', { type: 'error' })
    }
  }, [])

  return { shareProfile }
}
