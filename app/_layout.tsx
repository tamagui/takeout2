import { AppAnalyticsProvider } from 'contrast-better-auth/analytics/react'
import { ContrastProvider } from 'contrast-ui/provider/ContrastProvider'
import { Slot, Stack } from 'one'
import { isWeb, useTheme } from 'tamagui'
import { APP_NAME } from '~/constants'
import { appAnalytics } from '~/features/analytics/appAnalytics'
import { LINK_UNDERLINE_RESET, SAFE_AREA_VARS } from '~/interface/webRootCss'
import { config } from '~/tamagui/tamagui.config'

const webRootCss = `${SAFE_AREA_VARS}
${LINK_UNDERLINE_RESET}`

function AppRoutes() {
  // no Configuration disableSSR: these examples are SSG, and disableSSR puts
  // tamagui in client-only mode, which skips server-side atomic-style
  // extraction — the first paint ships until hydration.
  const theme = useTheme()
  if (isWeb) return <Slot />
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background?.val },
      }}
      // native starts at index; the native index resolves its session-aware
      // target itself (signed-in to app home, signed-out to /auth/login), so
      // the signed-out surface lives at its real route.
      initialRouteName="index"
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="home" />
    </Stack>
  )
}

function AppShell() {
  return (
    <AppAnalyticsProvider client={appAnalytics}>
      <ContrastProvider config={config}>
        <AppRoutes />
      </ContrastProvider>
    </AppAnalyticsProvider>
  )
}

export default function Layout() {
  const contents = <AppShell />

  if (isWeb) {
    return (
      <html lang="en-US">
        <head>
          <meta charSet="utf-8" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
          />
          <title>{APP_NAME}</title>
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
          <style dangerouslySetInnerHTML={{ __html: webRootCss }} />
        </head>
        <body>{contents}</body>
      </html>
    )
  }

  return contents
}
