import { useCallback } from 'react'
import { Share } from 'react-native'

import { showError } from '~/interface/dialogs/actions'
import { showToast } from '~/interface/toast/helpers'

import type { User } from '~/data/types'

export function useShareProfile() {
  const shareProfile = useCallback(async (user: User, publicProfileUrl: string) => {
    try {
      if (!process.env.VITE_NATIVE) {
        // Web: copy to clipboard
        await navigator.clipboard.writeText(publicProfileUrl)
        showToast('Profile link copied to clipboard!', { type: 'success' })
      } else {
        // Native: use share sheet
        const result = await Share.share({
          message: `Check out @${user.username || user.name} on our app!`,
          url: publicProfileUrl,
        })
        if (result.action === Share.sharedAction) {
          showToast('Profile shared!', { type: 'success' })
        }
      }

      // Analytics event removed - 'profile_shared' not in event types
      // analytics.track('profile_shared', {
      //   targetUserId: user.id,
      //   platform: Platform.OS,
      // })
    } catch (error) {
      console.error('Error sharing profile:', error)
      showError(error, 'Share Profile')
    }
  }, [])

  return { shareProfile }
}
