import './root.css'

import { Slot } from 'one'
import type { ReactNode } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { isWeb } from 'tamagui'
import { Dialogs } from '~/interface/dialogs/Dialogs'
import { TamaguiRootProvider } from '~/tamagui/TamaguiRootProvider'

export function Layout() {
  const contents = (
    <MinimalProviders>
      <Slot />
    </MinimalProviders>
  )

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
            {contents}
          </div>
        </body>
      </html>
    )
  }

  return contents
}

function MinimalProviders({ children }: { children: ReactNode }) {
  return (
    <TamaguiRootProvider>
      <Dialogs />
      <SafeAreaProvider>{children}</SafeAreaProvider>
    </TamaguiRootProvider>
  )
}
