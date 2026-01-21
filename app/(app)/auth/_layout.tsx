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
    <XStack flex={1} items="center" justify="center" p="$4">
      <XStack
        width="100%"
        maxW={1000}
        minH={600}
        rounded={32}
        overflow="hidden"
        position="relative"
        boxShadow="0 4px 24px $shadow4"
      >
        {/* left panel - onboarding (persists across all auth routes) */}
        <Onboarding />

        {/* right panel - auth content (changes based on route) */}
        <YStack flex={1} justify="center" items="center" p="$6">
          <Slot />
        </YStack>
      </XStack>
    </XStack>
  )
}
