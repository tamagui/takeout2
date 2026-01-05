import { Redirect, Slot, Stack, usePathname } from 'one'
import { Configuration, isWeb } from 'tamagui'

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

  const isAuthRoute = pathname === '/login' || pathname.startsWith('/signup')

  // routes outside of (app) group - don't redirect for these
  const isSiteRoute =
    pathname === '/' ||
    pathname === '/help' ||
    pathname.startsWith('/docs') ||
    pathname === '/terms-of-service' ||
    pathname === '/privacy-policy' ||
    pathname === '/eula'

  // redirect logged-out users away from protected routes (but not site routes)
  if (state === 'logged-out' && !isAuthRoute && !isSiteRoute) {
    return <Redirect href="/login" />
  }

  // redirect logged-in users away from auth routes
  if (state === 'logged-in' && isAuthRoute) {
    return <Redirect href="/home" />
  }

  return (
    // our app is SPA from here on down, we avoid extra rendering by doing this
    <Configuration disableSSR animationDriver={animationsApp}>
      <ProvideZero>
        <ToastProvider>
          <NotificationProvider>
            <PlatformSpecificRootProvider>
              {isWeb ? (
                <DragDropFile>
                  <Gallery />
                  <Slot />
                </DragDropFile>
              ) : (
                // We need Stack here for transition animation to work on native
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(auth-onboard)" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="ai" />
                  <Stack.Screen name="search" />
                  <Stack.Screen name="settings" />
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
