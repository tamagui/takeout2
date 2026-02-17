import { useEffect } from 'react'
import { Linking } from 'react-native'

import { APP_SCHEME } from '~/features/auth/constants'
import { dialogEmit } from '~/interface/dialogs/shared'

function handleUrl(url: string) {
  if (url === `${APP_SCHEME}://create-post`) {
    dialogEmit({ type: 'create-post' })
  }
  // takeout://profile is handled by normal routing
}

export function useWidgetDeepLink() {
  useEffect(() => {
    // handle cold start
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url)
    })

    // handle when app is already open
    const sub = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url)
    })

    return () => sub.remove()
  }, [])
}
