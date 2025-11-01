import { createZeroClient } from 'over-zero'
import { useMemo, type ReactNode } from 'react'
import { isClient, isWeb } from 'tamagui'
import { useAuth } from '~/features/auth/client/authClient'
import type { AuthData } from '~/features/auth/types'
import { models } from '~/data/generated/models'
import { schema } from '~/data/schema'

const disable = false

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

const ZERO_SERVER =
  typeof location !== 'undefined'
    ? location.host === 'start.chat'
      ? 'https://zero.start.chat'
      : import.meta.env.VITE_PUBLIC_ZERO_SERVER
    : import.meta.env.VITE_PUBLIC_ZERO_SERVER

if (!ZERO_SERVER) {
  throw new Error(`No zero server`)
}

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
