import { Slot } from 'one'
import type { ReactNode } from 'react'
import './root.css'

import { Stack } from 'one'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { isWeb } from 'tamagui'
import {
  ROOT_AUTH_ONBOARD_ROUTE_NAME,
  ROOT_MAIN_ROUTE_NAME,
} from '~/constants/navigation'
import { NotificationProvider } from '~/interface/notification/Notification'
import { ToastProvider } from '~/interface/toast/Toast'
import { DragDropFile } from '~/interface/upload/DragDropFile'
import { PlatformSpecificProvider } from '~/providers/PlatformSpecificProvider'
import { TamaguiRootProvider } from '~/tamagui/TamaguiRootProvider'
import { ProvideZero } from '~/zero/client'

function Providers({ children }: { children: ReactNode }) {
  return (
    <ProvideZero>
      <TamaguiRootProvider>
        <SafeAreaProvider>
          <ToastProvider>
            <NotificationProvider>
              <PlatformSpecificProvider>{children}</PlatformSpecificProvider>
            </NotificationProvider>
          </ToastProvider>
        </SafeAreaProvider>
      </TamaguiRootProvider>
    </ProvideZero>
  )
}

export function Layout() {
  if (isWeb) {
    return (
      <html data-tauri-drag-region lang="en-US">
        <head>
          <meta charSet="utf-8" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          <meta property="og:image" content={`${process.env.ONE_SERVER_URL}/og.jpg`} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="twitter:card" content="summary_large_image" />
          <meta
            property="twitter:image"
            content={`${process.env.ONE_SERVER_URL}/og.jpg`}
          />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
          />
          <link rel="icon" href="/favicon.svg" />
        </head>

        <body>
          <div style={{ display: 'contents' }} data-testid="app-container">
            <Providers>
              <DragDropFile>
                <Slot />
              </DragDropFile>
            </Providers>
          </div>
        </body>
      </html>
    )
  }

  return (
    <KeyboardProvider>
      <Providers>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
          initialRouteName={ROOT_MAIN_ROUTE_NAME}
        >
          <Stack.Screen name={ROOT_MAIN_ROUTE_NAME} />
          <Stack.Screen
            name={ROOT_AUTH_ONBOARD_ROUTE_NAME}
            options={{
              gestureEnabled: false,
            }}
          />
        </Stack>
      </Providers>
    </KeyboardProvider>
  )
}
