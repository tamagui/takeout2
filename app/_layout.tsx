import '~/features/devtools/devGlobals'
import '~/interface/fonts/jetbrains.css'
import '~/tamagui/tamagui.css'
import './effects.css'
import './gradient-blur.css'
import './root.css'

import {
  MetaTheme,
  SchemeProvider,
  setSchemeSetting,
  useColorScheme,
} from '@vxrn/color-scheme'
import { Slot, usePathname } from 'one'
import { memo, useLayoutEffect } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { setupDev, TamaguiProvider, useTheme } from 'tamagui'
import { AppProvider } from '~/features/apps/ui/AppProvider'
import { NotificationProvider } from '~/interface/notification/Notification'
import { ToastProvider } from '~/interface/toast/Toast'
import { DragDropFile } from '~/interface/upload/DragDropFile'
import { config } from '~/tamagui/tamagui.config'
import { ProvideZero } from '~/zero/client'

if (process.env.NODE_ENV === 'development') {
  setupDev({
    visualizer: true,
  })
}

/**
 * The root _layout.tsx filters <html /> and <body /> out on native
 */

export function Layout() {
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
        {/* <LoadProgressBar startDelay={1_000} /> */}

        <div style={{ display: 'contents' }} data-testid="app-container">
          <ProvideZero>
            <TamaguiRootProvider>
              <ThemeMetaTag />
              <SafeAreaProvider>
                <ToastProvider>
                  <NotificationProvider>
                    <DragDropFile>
                      {/* <MetaThemeName /> */}
                      <Slot />
                    </DragDropFile>
                  </NotificationProvider>
                </ToastProvider>
              </SafeAreaProvider>
            </TamaguiRootProvider>
          </ProvideZero>
        </div>
      </body>
    </html>
  )
}

const TamaguiRootProvider = memo(({ children }: { children: any }) => {
  const [scheme] = useColorScheme()
  const pathname = usePathname()
  const forceDark = pathname.startsWith('/_/')

  useLayoutEffect(() => {
    if (forceDark) {
      setSchemeSetting('dark')
    } else {
      setSchemeSetting('system')
    }
  }, [forceDark])

  return (
    <TamaguiProvider
      disableInjectCSS
      config={config}
      defaultTheme={forceDark ? 'dark' : scheme}
    >
      {forceDark && <div className="body-dark" />}
      <SchemeProvider>{children}</SchemeProvider>
    </TamaguiProvider>
  )
})

const ThemeMetaTag = () => {
  const theme = useTheme()
  return <MetaTheme color={theme.background.val} darkColor={'#000'} lightColor="#fff" />
}
