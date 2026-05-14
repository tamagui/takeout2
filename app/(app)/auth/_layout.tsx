import { Redirect, Slot, Stack } from 'one'
import { XStack, YStack } from 'tamagui'

import { useAuth } from '~/features/auth/client/authClient'
import { Onboarding } from '~/features/onboarding'

export function AuthAndOnboardingLayout() {
  // redirect from inside the focused auth screen — putting this in the parent
  // (app)/_layout unmounts <Stack> before the redirect lands, so the native
  // stack never transitions. inside the focused screen, useFocusEffect fires
  // correctly and the stack swaps to the home screen.
  const { state } = useAuth()
  if (state === 'logged-in') {
    return <Redirect href="/home/feed" />
  }

  if (process.env.VITE_NATIVE) {
    return <Slot />
  }

  return (
    <XStack
      minH="100vh"
      flex={1}
      flexBasis="auto"
      items="center"
      justify="center"
      $platform-web={{
        mt: -50,
      }}
    >
      <XStack
        width="100%"
        maxW={860}
        maxH="auto"
        minH={550}
        rounded="$10"
        overflow="hidden"
        position="relative"
        boxShadow="0 12px 24px $shadow2"
        $md={{ maxW: 860, minH: 550, mt: 0 }}
        $theme-dark={{
          borderWidth: 0.5,
          borderColor: '$borderColor',
        }}
      >
        <Onboarding />

        <YStack flex={1} $md={{ p: '$4' }}>
          <Slot />
        </YStack>
      </XStack>
    </XStack>
  )
}
