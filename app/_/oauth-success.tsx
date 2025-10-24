import { Check } from '@tamagui/lucide-icons'
import { YStack } from 'tamagui'

// TODO one - since we default to SPA, this should work, but prod build breaks if you remove the window check?
if (typeof window !== 'undefined') {
  if (window.opener) {
    window.opener.postMessage({ type: 'oauth-success' }, window.location.origin)
    window.close()
  }
}

export function LoginSuccess() {
  return (
    <YStack flex={1} items="center" justify="center" width="100%" height="100%">
      <Check opacity={0.5} />
    </YStack>
  )
}
