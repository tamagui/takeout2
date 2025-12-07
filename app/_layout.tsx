import './root.css'

import * as SplashScreen from 'expo-splash-screen'
import { Slot, Stack } from 'one'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { isWeb } from 'tamagui'

import { TamaguiRootProvider } from '~/tamagui/TamaguiRootProvider'

// NOTE: we need to set the splash options at root layout for it to work on native
SplashScreen.setOptions({
  duration: 250,
  fade: true,
})
SplashScreen.preventAutoHideAsync()

export function Layout() {
  const contents = (
    <TamaguiRootProvider>
      <SafeAreaProvider>
        {isWeb ? (
          <Slot />
        ) : (
          // We need specific Stack here to avoid (site) layout being used on native
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(app)" />
          </Stack>
        )}
      </SafeAreaProvider>
    </TamaguiRootProvider>
  )

  if (isWeb) {
    return (
      <html lang="en-US">
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
            {contents}
          </div>
        </body>
      </html>
    )
  }

  return contents
}
