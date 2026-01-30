import { Slot, Stack } from 'one'

export function AppLayout() {
  return (
    <>
      {!process.env.VITE_NATIVE ? (
        <Slot />
      ) : (
        // We need Stack here for transition animation to work on native
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="notification" />
        </Stack>
      )}
    </>
  )
}
