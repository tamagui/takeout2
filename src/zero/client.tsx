import { createZeroClient } from 'over-zero'
import { useMemo, type ReactNode } from 'react'
import { isClient, isWeb } from 'tamagui'
import { useAuth } from '~/auth/client/authClient'
import { models } from '~/data/models'
import { schema } from '~/data/schema'
import type { AuthData } from '~/start/src/types'

const disable =
  typeof window !== 'undefined' &&
  window.location?.pathname.startsWith('/_/') &&
  // whitelist pages to allow zero
  window.location?.pathname !== '/_/login-success' &&
  !window.location?.pathname.startsWith('/_/app')

if (disable) {
  console.info(`0️⃣ Zero disabled on this page`)
}

export const {
  usePermission,
  useQuery,
  zero,
  ProvideZero: ProvideZeroWithoutAuth,
  zeroEvents,
} = createZeroClient({
  models,
  schema,
  disable,
})

const ZERO_SERVER: string =
  typeof location !== 'undefined'
    ? location.host === 'start.chat'
      ? 'https://zero.start.chat'
      : import.meta.env.VITE_PUBLIC_ZERO_SERVER
    : import.meta.env.VITE_PUBLIC_ZERO_SERVER

export const ProvideZero = ({ children }: { children: ReactNode }) => {
  const auth = useAuth()
  const userId = auth?.user?.id || 'anon'
  const jwtToken = auth?.token || ''
  const email = auth.user?.email
  const role = auth.user?.role

  const authData = useMemo((): AuthData | null => {
    if (!email) return null

    return {
      email,
      id: userId,
      role: role,
    }
  }, [userId, email, role])

  console.info(`[zero]`, { auth, jwtToken, userId, email, ZERO_SERVER })

  return (
    <ProvideZeroWithoutAuth
      userID={userId}
      auth={jwtToken}
      kvStore={isWeb && isClient && userId ? 'idb' : 'mem'}
      authData={authData}
      server={ZERO_SERVER}
    >
      {children}
    </ProvideZeroWithoutAuth>
  )
}
