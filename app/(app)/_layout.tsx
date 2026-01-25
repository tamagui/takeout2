import { Protected, Redirect, Slot, Stack, usePathname } from 'one'
import { Configuration, isWeb } from 'tamagui'

import { useAuth } from '~/features/auth/client/authClient'
import { Dialogs } from '~/interface/dialogs/Dialogs'
import { Gallery } from '~/interface/gallery/Gallery'
import { NotificationProvider } from '~/interface/notification/Notification'
import { ToastProvider } from '~/interface/toast/Toast'
import { DragDropFile } from '~/interface/upload/DragDropFile'
import { animationsApp } from '~/tamagui/animationsApp'
import { ProvideZero } from '~/zero/client'

export function AppLayout() {
  const { state } = useAuth()
  const pathname = usePathname()
  const isLoggedIn = state === 'logged-in'

  if (state === 'loading') {
    return null
  }

  // web: use Redirect for auth routing (Protected works with Stack)
  if (isWeb) {
    if (!isLoggedIn && pathname.startsWith('/home')) {
      return <Redirect href="/auth/login" />
    }
    if (isLoggedIn && pathname.startsWith('/auth')) {
      return <Redirect href="/home/feed" />
    }
  }

  return (
    // our app is SPA from here on down, we avoid extra work by disabling SSR
    <Configuration disableSSR animationDriver={animationsApp}>
      <ProvideZero>
        <ToastProvider>
          <NotificationProvider>
            {process.env.VITE_PLATFORM === 'web' ? (
              <DragDropFile>
                <Gallery />
                <Slot />
              </DragDropFile>
            ) : (
              // We need Stack here for transition animation to work on native
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: 'none',
                }}
              >
                <Protected guard={!isLoggedIn}>
                  <Stack.Screen name="auth" />
                </Protected>
                <Protected guard={isLoggedIn}>
                  <Stack.Screen name="home" />
                </Protected>
              </Stack>
            )}
          </NotificationProvider>
          <Dialogs />
        </ToastProvider>
      </ProvideZero>
    </Configuration>
  )
}
