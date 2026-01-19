import { dropAllDatabases } from '@rocicorp/zero'
import { useZero } from '@rocicorp/zero/react'
import { createZeroClient } from 'over-zero'
import { memo, useEffect, useMemo, type ReactNode } from 'react'
import { isClient, isWeb } from 'tamagui'

import { ZERO_SERVER_URL } from '~/constants/urls'
import * as groupedQueries from '~/data/generated/groupedQueries'
import { models } from '~/data/generated/models'
import { schema } from '~/data/schema'
import { useAuth } from '~/features/auth/client/authClient'
import { setDevGlobal } from '~/features/devtools/devGlobal'

import type { AuthData } from '~/features/auth/types'

export const {
  usePermission,
  useQuery,
  zero,
  ProvideZero: ProvideZeroWithoutAuth,
  zeroEvents,
} = createZeroClient({
  models,
  schema,
  groupedQueries,
})

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

  const kvStore = isWeb && isClient && userId ? 'idb' : 'mem'

  console.info(`[zero]`, { auth, jwtToken, userId, ZERO_SERVER_URL })

  return (
    <ProvideZeroWithoutAuth
      userID={userId}
      auth={jwtToken}
      kvStore={kvStore}
      authData={authData}
      server={ZERO_SERVER_URL}
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
