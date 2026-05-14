import { Redirect, Slot, Stack } from 'one'

import { useAuth } from '~/features/auth/client/authClient'
import { notificationPromptStorage } from '~/features/notification/notificationPromptStorage'
import { ProvideZero } from '~/zero/client'

export const AppLayout = () => {
  // redirect from inside the focused home screen (see auth/_layout.tsx)
  const { state } = useAuth()

  // check if user has seen the notification prompt (sync read from MMKV)
  const hasSeenNotificationPrompt = notificationPromptStorage.get() === true

  if (state === 'logged-out') {
    return <Redirect href="/auth/login" />
  }

  return (
    <>
      {!process.env.VITE_NATIVE ? (
        <Slot />
      ) : (
        <ProvideZero>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
            initialRouteName={hasSeenNotificationPrompt ? '(tabs)' : 'notification'}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="notification" />
          </Stack>
        </ProvideZero>
      )}
    </>
  )
}
