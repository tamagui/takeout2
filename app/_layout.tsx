import './root.css'

import { Slot } from 'one'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useAuth } from '~/features/auth/client/authClient'
import { HotUpdateAlertManager, HotUpdaterProvider } from '~/features/hot-updater'
import { Gallery } from '~/interface/gallery/Gallery'
import { NotificationProvider } from '~/interface/notification/Notification'
import { ToastProvider } from '~/interface/toast/Toast'
import { DragDropFile } from '~/interface/upload/DragDropFile'
import { TamaguiRootProvider } from '~/tamagui/TamaguiRootProvider'
import { ProvideZero } from '~/zero/client'

/**
 * The root _layout.tsx filters <html /> and <body /> out on native
 */

export function Layout() {
  const { user } = useAuth()

  return (
    <html data-tauri-drag-region lang="en-US">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta property="og:image" content={`${process.env.ONE_SERVER_URL}/og.jpg`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:image" content={`${process.env.ONE_SERVER_URL}/og.jpg`} />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <link rel="icon" href="/favicon.svg" />
      </head>

      <body>
        <div style={{ display: 'contents' }} data-testid="app-container">
          <ProvideZero>
            <TamaguiRootProvider>
              <SafeAreaProvider>
                <HotUpdaterProvider>
                  <ToastProvider>
                    <NotificationProvider>
                      <DragDropFile>
                        <HotUpdateAlertManager />
                        <Gallery />
                        <Slot />
                      </DragDropFile>
                    </NotificationProvider>
                  </ToastProvider>
                </HotUpdaterProvider>
              </SafeAreaProvider>
            </TamaguiRootProvider>
          </ProvideZero>
        </div>
      </body>
    </html>
  )
}
