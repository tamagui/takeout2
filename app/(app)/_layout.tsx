import { Redirect, Slot, Stack, usePathname } from 'one'
import { Configuration, SizableText } from 'tamagui'

import { useAuth } from '~/features/auth/client/authClient'
import { ZeroTestUI } from '~/features/devtools/ZeroTestUI'
import { useWidgetDeepLink } from '~/features/widgets/useWidgetDeepLink'
import { useWidgets } from '~/features/widgets/useWidgets'
import { Dialogs } from '~/interface/dialogs/Dialogs'
import { Gallery } from '~/interface/gallery/Gallery'
import { NotificationProvider } from '~/interface/notification/Notification'
import { ToastProvider } from '~/interface/toast/Toast'
import { DragDropFile } from '~/interface/upload/DragDropFile'
import { animationsApp } from '~/tamagui/animationsApp'
import { ProvideZero } from '~/zero/client'

function WidgetSetup() {
  useWidgetDeepLink()
  useWidgets()
  return null
}

export function AppLayout() {
  const { state } = useAuth()
  const pathname = usePathname()
  const isLoggedIn = state === 'logged-in'

  if (state === 'loading') {
    return (
      <SizableText m="auto" color="$color8">
        Loading...
      </SizableText>
    )
  }

  // redirect for auth routing (works on both web and native)
  if (!isLoggedIn && pathname.startsWith('/home')) {
    return <Redirect href="/auth/login" />
  }
  if (isLoggedIn && pathname.startsWith('/auth')) {
    return <Redirect href="/home/feed" />
  }

  return (
    // our app is SPA from here on down, avoid extra work by disabling SSR
    <Configuration disableSSR animationDriver={animationsApp}>
      {process.env.VITE_NATIVE ? (
        <ToastProvider>
          <NotificationProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'none',
              }}
            >
              <Stack.Screen name="auth" />
              <Stack.Screen name="home" />
            </Stack>
          </NotificationProvider>
        </ToastProvider>
      ) : (
        <ProvideZero>
          <WidgetSetup />
          <ToastProvider>
            <NotificationProvider>
              <DragDropFile>
                <Gallery />
                <Slot />
              </DragDropFile>
            </NotificationProvider>
            <Dialogs />
          </ToastProvider>
          <ZeroTestUI />
        </ProvideZero>
      )}
    </Configuration>
  )
}
