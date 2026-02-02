import { Slot, Stack } from 'one'

import { notificationPromptStorage } from '~/features/notification/notificationPromptStorage'

export const AppLayout = () => {
  // check if user has seen the notification prompt (sync read from MMKV)
  const hasSeenNotificationPrompt = notificationPromptStorage.get() === true

  return (
    <>
      {!process.env.VITE_NATIVE ? (
        <Slot />
      ) : (
        // show notification prompt on first login, otherwise show tabs
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
      )}
    </>
  )
}
