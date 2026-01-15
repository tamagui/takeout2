import { Redirect, Slot, Stack, usePathname } from 'one'
import { Configuration } from 'tamagui'

import { useAuth } from '~/features/auth/client/authClient'
import { Dialogs } from '~/interface/dialogs/Dialogs'
import { Gallery } from '~/interface/gallery/Gallery'
import { NotificationProvider } from '~/interface/notification/Notification'
import { PlatformSpecificRootProvider } from '~/interface/platform/PlatformSpecificRootProvider'
import { ToastProvider } from '~/interface/toast/Toast'
import { DragDropFile } from '~/interface/upload/DragDropFile'
import { animationsApp } from '~/tamagui/animationsApp'
import { ProvideZero } from '~/zero/client'

export function AppLayout() {
  const { state } = useAuth()
  const pathname = usePathname()

  if (state === 'loading') {
    return null
  }

  // redirect logged-out users away from protected routes
  const isLoggedInRoute = pathname.startsWith('/home')
  if (state === 'logged-out' && isLoggedInRoute) {
    return <Redirect href="/auth/login" />
  }

  // redirect logged-in users away from auth routes
  const isAuthRoute = pathname.startsWith('/auth')
  if (state === 'logged-in' && isAuthRoute) {
    return <Redirect href="/home/feed" />
  }

  return (
    // our app is SPA from here on down, we avoid extra work by disabling SSR
    <Configuration disableSSR animationDriver={animationsApp}>
      <ProvideZero>
        <ToastProvider>
          <NotificationProvider>
            <PlatformSpecificRootProvider>
              {process.env.VITE_PLATFORM === 'web' ? (
                <DragDropFile>
                  <Gallery />
                  <Slot />
                </DragDropFile>
              ) : (
                // We need Stack here for transition animation to work on native
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="home" />
                  <Stack.Screen name="auth" />
                </Stack>
              )}
              <Dialogs />
            </PlatformSpecificRootProvider>
          </NotificationProvider>
        </ToastProvider>
      </ProvideZero>
    </Configuration>
  )
}
