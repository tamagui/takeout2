import { Slot, Stack } from 'one'
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

  if (state === 'loading') {
    return (
      <SizableText m="auto" color="$color8">
        Loading...
      </SizableText>
    )
  }

  // auth redirects live in app/(app)/auth/_layout.tsx and app/(app)/home/_layout.tsx —
  // they must run from inside a focused stack screen on native, not above the stack

  return (
    // our app is SPA from here on down, avoid extra work by disabling SSR
    <Configuration disableSSR animationDriver={animationsApp}>
      {process.env.VITE_NATIVE ? (
        <ProvideZero>
          <WidgetSetup />
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
            <Dialogs />
          </ToastProvider>
        </ProvideZero>
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
