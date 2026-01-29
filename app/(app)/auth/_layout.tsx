import { Slot, Stack } from 'one'
import { XStack, YStack } from 'tamagui'

import { Onboarding } from '~/features/onboarding'

export function AuthAndOnboardingLayout() {
  if (process.env.VITE_NATIVE) {
    return (
      <Stack
        screenOptions={{
          headerShown: false,
        }}
        initialRouteName="login"
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="signup/[method]" />
        <Stack.Screen name="signup/otp" />
      </Stack>
    )
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
