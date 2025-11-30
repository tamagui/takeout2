import { Redirect, Slot, Stack, usePathname } from 'one'
import { isWeb, SizableText } from 'tamagui'
import { useAuth } from '~/features/auth/client/authClient'
import { Dialogs } from '~/interface/dialogs/Dialogs'
import { NotificationProvider } from '~/interface/notification/Notification'
import { ToastProvider } from '~/interface/toast/Toast'
import { DragDropFile } from '~/interface/upload/DragDropFile'
import { PlatformSpecificRootProvider } from '~/providers/PlatformSpecificRootProvider'
import { ProvideZero } from '~/zero/client'

export function AppLayout() {
  const { state } = useAuth()
  const pathname = usePathname()

  if (state === 'loading') {
    return <SizableText>Loading...</SizableText>
  }

  const isAuthRoute = pathname === '/login' || pathname.startsWith('/signup')

  // redirect logged-out users away from protected routes
  if (state === 'logged-out' && !isAuthRoute) {
    return <Redirect href="/login" />
  }

  // redirect logged-in users away from auth routes
  if (state === 'logged-in' && isAuthRoute) {
    return <Redirect href="/home" />
  }

  return (
    <ProvideZero>
      <ToastProvider>
        <NotificationProvider>
          <PlatformSpecificRootProvider>
            <DragDropFile>
              {isWeb ? (
                <Slot />
              ) : (
                // We need Stack here for transition animation to work on native
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(auth-onboard)" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="settings" />
                </Stack>
              )}
              <Dialogs />
            </DragDropFile>
          </PlatformSpecificRootProvider>
        </NotificationProvider>
      </ToastProvider>
    </ProvideZero>
  )
}
