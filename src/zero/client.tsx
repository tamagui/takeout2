import { dropAllDatabases } from '@rocicorp/zero'
import { useZero } from '@rocicorp/zero/react'
import { isBrowser } from '@tamagui/constants'
import { createZeroClient } from 'over-zero'
import { memo, useEffect, useMemo, type ReactNode } from 'react'

import { ZERO_SERVER_URL } from '~/constants/urls'
import * as groupedQueries from '~/data/generated/groupedQueries'
import { models } from '~/data/generated/models'
import { schema } from '~/data/schema'
import { useAuth } from '~/features/auth/client/authClient'
import { DEBUG_LEVEL } from '~/features/devtools/constants'
import { setDevGlobal } from '~/features/devtools/devGlobal'

import type { AuthData } from '~/features/auth/types'

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

// re-export global run for convenience
export { run } from 'over-zero'

export const ProvideZero = ({ children }: { children: ReactNode }) => {
  const auth = useAuth()
  const userId = auth?.user?.id || 'anon'
  const jwtToken = auth?.token || ''
  const role = auth.user?.role

  // memoize authData to prevent unnecessary re-renders
  const authData = useMemo((): AuthData | null => {
    if (userId === 'anon') {
      return null
    }

    return {
      id: userId,
      role: role,
    }
  }, [userId, role])

  const kvStore = isBrowser && userId ? 'idb' : 'mem'

  if (DEBUG_LEVEL > 1) {
    console.info(`[zero]`, { auth, jwtToken, userId, ZERO_SERVER_URL })
  }

  return (
    <ProvideZeroWithoutAuth
      userID={userId}
      auth={jwtToken}
      kvStore={kvStore}
      authData={authData}
      cacheURL={ZERO_SERVER_URL}
    >
      {children}
      <ZeroDevTools />
    </ProvideZeroWithoutAuth>
  )
}

const ZeroDevTools = memo(() => {
  const zero = useZero()

  useEffect(() => {
    setDevGlobal(zero, 'zero')
    setDevGlobal(dropAllDatabases, 'dropAllDatabases')
  }, [zero])

  return null
})
