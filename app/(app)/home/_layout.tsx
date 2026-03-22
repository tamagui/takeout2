import { Slot, Stack } from 'one'

import { notificationPromptStorage } from '~/features/notification/notificationPromptStorage'
import { ProvideZero } from '~/zero/client'

export const AppLayout = () => {
  // check if user has seen the notification prompt (sync read from MMKV)
  const hasSeenNotificationPrompt = notificationPromptStorage.get() === true

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
