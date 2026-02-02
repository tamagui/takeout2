import { router } from 'one'
import { useEffect, useState } from 'react'
import { isWeb } from 'tamagui'

import { notificationPromptStorage } from './notificationPromptStorage'

// returns whether to show the notification prompt page
// handles redirect on native when user hasn't seen the prompt
export const useNotificationPromptFlow = () => {
  const [hasSeenPrompt, setHasSeenPrompt] = useState<boolean | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // skip on web - no push notifications
    if (isWeb) {
      setHasSeenPrompt(true)
      setIsReady(true)
      return
    }

    const checkStorage = async () => {
      const seen = notificationPromptStorage.get()
      setHasSeenPrompt(seen === true)
      setIsReady(true)
    }

    checkStorage()
  }, [])

  // redirect to notification page if not seen
  useEffect(() => {
    if (!isReady || hasSeenPrompt === null) return

    if (!hasSeenPrompt && !isWeb) {
      router.replace('/home/notification')
    }
  }, [isReady, hasSeenPrompt])

  return {
    hasSeenPrompt,
    isReady,
    shouldShowPrompt: isReady && !hasSeenPrompt && !isWeb,
  }
}

// mark the notification prompt as seen
export const markNotificationPromptSeen = () => {
  notificationPromptStorage.set(true)
}
