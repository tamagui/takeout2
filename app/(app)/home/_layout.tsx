import { Redirect, Slot, Stack, usePathname } from 'one'

import { notificationPromptStorage } from '~/features/notification/notificationPromptStorage'
import { ProvideZero } from '~/zero/client'

export const AppLayout = () => {
  const pathname = usePathname()
  // check if user has seen the notification prompt (sync read from MMKV)
  const hasSeenNotificationPrompt = notificationPromptStorage.get() === true

  // redirect bare /home to /home/feed on web (native uses Stack initialRouteName)
  if (!process.env.VITE_NATIVE && pathname === '/home') {
    return <Redirect href="/home/feed" />
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
