import './root.css'

import { isWeb } from 'tamagui'
import { PlatformSpecificProvider } from '~/providers/PlatformSpecificProvider'

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
          <PlatformSpecificProvider />
        </body>
      </html>
    )
  }

  return <PlatformSpecificProvider />
}
