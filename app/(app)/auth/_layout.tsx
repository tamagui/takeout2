import { Slot, Stack } from 'one'

export function AuthAndOnboardingLayout() {
  return (
    <>
      {process.env.VITE_PLATFORM === 'web' ? (
        <Slot />
      ) : (
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
      )}
    </>
  )
}
