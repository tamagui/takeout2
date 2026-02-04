import { dropAllDatabases } from '@rocicorp/zero'
import { useZero } from '@rocicorp/zero/react'
import { isBrowser } from '@tamagui/constants'
import { createZeroClient } from 'on-zero'
import { memo, useEffect, type ReactNode } from 'react'

import { ZERO_SERVER_URL } from '~/constants/urls'
import * as groupedQueries from '~/data/generated/groupedQueries'
import { models } from '~/data/generated/models'
import { schema } from '~/data/schema'
import { useAuth } from '~/features/auth/client/authClient'
import { setDevGlobal } from '~/features/devtools/devGlobal'

export const {
  usePermission,
  useQuery,
  zero,
  ProvideZero: ProvideZeroWithoutAuth,
  zeroEvents,
  preload,
} = createZeroClient({
  models,
  schema,
  groupedQueries,
})

export const ProvideZero = ({ children }: { children: ReactNode }) => {
  const auth = useAuth()
  const kvStore = isBrowser && auth ? 'idb' : 'mem'

  return (
    <ProvideZeroWithoutAuth
      userID={auth.user?.id || 'anon'}
      auth={auth.authClient.getCookie()}
      kvStore={kvStore}
      authData={auth.authData}
      cacheURL={ZERO_SERVER_URL}
      logLevel="debug"
    >
      {children}
      <ZeroDevTools />
      <ZeroErrorHandler />
    </ProvideZeroWithoutAuth>
  )
}

const ZeroErrorHandler = memo(() => {
  useEffect(() => {
    return zeroEvents.listen((event) => {
      if (!event) return
      if (event.type === 'error' && event.message) {
        console.warn('[zero] Error:', event.message)
        // TODO is have a better system to avoid spamming / sending before recovery tried
        // example, sometimes zero can error a lot / recover so not enabled:
        // clearAllAuth()
        // showNotification(`Invalid login`, {
        //   display: 'error',
        //   description: `Please refresh your browser to log in again.`,
        // })
      }
    })
  }, [])

  return null
})

const ZeroDevTools = memo(() => {
  const zero = useZero()

  useEffect(() => {
    setDevGlobal(zero, 'zero')
    setDevGlobal(dropAllDatabases, 'dropAllDatabases')
  }, [zero])

  return null
})
