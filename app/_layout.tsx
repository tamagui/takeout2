import './root.css'
import './syntax-highlight.css'

import { Slot, Stack } from 'one'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { GlobalTooltipProvider } from '~/interface/tooltip/TooltipSimple'
import { TamaguiRootProvider } from '~/tamagui/TamaguiRootProvider'

export function Layout() {
  return (
    <html lang="en-US">
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
          content="width=device-width, initial-scale=1.0, maximum-scale=5.0"
        />
        <link rel="icon" href="/favicon.svg" />
      </head>

      <body>
        <div style={{ display: 'contents' }} data-testid="app-container">
          <TamaguiRootProvider>
            <GlobalTooltipProvider>
              <SafeAreaProvider>
                {process.env.EXPO_OS === 'web' ? (
                  <Slot />
                ) : (
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(app)" />
                  </Stack>
                )}
              </SafeAreaProvider>
            </GlobalTooltipProvider>
          </TamaguiRootProvider>
        </div>
      </body>
    </html>
  )
}
