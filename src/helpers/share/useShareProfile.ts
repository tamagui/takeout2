import { useCallback } from 'react'
import { Share, Platform } from 'react-native'
import type { User } from '~/data/models'
import { showToast } from '~/interface/toast/helpers'
import { analytics } from '~/features/analytics/analytics'

export function useShareProfile() {
  const shareProfile = useCallback(async (user: User, publicProfileUrl: string) => {
    try {
      if (Platform.OS === 'web') {
        // Web: copy to clipboard
        await navigator.clipboard.writeText(publicProfileUrl)
        showToast({ title: 'Profile link copied to clipboard!', preset: 'done' })
      } else {
        // Native: use share sheet
        await Share.share({
          message: `Check out @${user.username || user.name} on our app!`,
          url: publicProfileUrl,
        })
      }

      analytics.track('profile_shared', {
        targetUserId: user.id,
        platform: Platform.OS,
      })
    } catch (error) {
      console.error('Error sharing profile:', error)
      showToast({ title: 'Failed to share profile', preset: 'error' })
    }
  }, [])

  return { shareProfile }
}