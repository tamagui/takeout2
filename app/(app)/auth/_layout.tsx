import { Slot, Stack } from 'one'
import { XStack, YStack } from 'tamagui'

import { Onboarding } from '~/features/onboarding'

export function AuthAndOnboardingLayout() {
  if (process.env.VITE_PLATFORM !== 'web') {
    return (
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}
        initialRouteName="login"
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="login/password" />
        <Stack.Screen name="signup/[method]" />
        <Stack.Screen name="signup/otp" />
        <Stack.Screen name="waiting-list" />
      </Stack>
    )
  }

  return (
    <XStack flex={1} items="center" justify="center" p="$4" $maxSM={{ p: 0 }}>
      <XStack
        width="100%"
        maxW={1000}
        minH={600}
        rounded={32}
        overflow="hidden"
        position="relative"
        boxShadow="0 4px 24px $shadow4"
        $maxSM={{ minH: 'auto', mt: '$6' }}
        $theme-dark={{
          borderWidth: 0.5,
          borderColor: '$borderColor',
        }}
      >
        <Onboarding />

        <YStack flex={1} p="$3" $maxSM={{ p: 0 }}>
          <Slot />
        </YStack>
      </XStack>
    </XStack>
  )
}
