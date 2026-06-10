import { useConnectionState, useZero } from '@rocicorp/zero/react'
import { createZeroClient, run } from 'on-zero'
import { Component, memo, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { debounce, SizableText, YStack } from 'tamagui'

import { Button } from '~/interface/buttons/Button'

import { dropAllDatabases } from '@rocicorp/zero'
import { ZERO_SERVER_URL } from '~/constants/urls'
import * as groupedQueries from '~/data/generated/groupedQueries'
import { models } from '~/data/generated/models'
import { userByUsername } from '~/data/queries/user'
import { schema } from '~/data/generated/schema'
import { authClient, useAuth } from '~/features/auth/client/authClient'
import { setDevGlobal } from '~/features/devtools/devGlobal'
import { showToast } from '~/interface/toast/Toast'
import { unstable_batchedUpdates } from './batchUpdates'
import { createKVStore } from './storage'

export const {
  usePermission,
  useQuery,
  getQuery,
  zero,
  ProvideZero: ProvideZeroWithoutAuth,
  zeroEvents,
  preload,
} = createZeroClient({
  models,
  schema,
  groupedQueries,
})

const ProvideZeroImpl = ({ children }: { children: ReactNode }) => {
  const auth = useAuth()
  const userId = auth?.user?.id || 'anon'

  // stabilize authData across auth transitions to prevent mutations from
  // seeing null during brief re-render gaps (e.g. session refresh, tab wake)
  const stableAuthDataRef = useRef(auth.authData)
  if (auth.authData) {
    stableAuthDataRef.current = auth.authData
  }
  const stableAuthData = auth.authData ?? stableAuthDataRef.current

  const authed = !!auth?.user?.email

  const kvStore = useMemo(() => createKVStore(userId), [userId])

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.info(`[zero] ${authed ? 'authed' : 'anon'}`, {
        userId,
        ZERO_SERVER_URL,
        kvStore,
      })
    }
  }, [authed, userId, kvStore])

  // prefer explicit session auth for zero when available
  const zeroAuth = (() => {
    if (process.env.VITE_NATIVE) {
      return (auth.authClient as any).getCookie()
    }

    const sessionToken = auth.session?.token
    if (sessionToken) {
      return sessionToken
    }
  })()

  return (
    <ProvideZeroWithoutAuth
      userID={userId}
      auth={zeroAuth}
      kvStore={kvStore}
      authData={stableAuthData}
      cacheURL={ZERO_SERVER_URL}
      {...(unstable_batchedUpdates ? { batchViewUpdates: unstable_batchedUpdates } : {})}
    >
      {children}
      <ZeroDebug />
      <ZeroConnectionMonitor />
    </ProvideZeroWithoutAuth>
  )
}

class ZeroErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: any) {
    console.error('[zero] error boundary caught:', error.message, info?.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <ZeroErrorFallback
          error={this.state.error}
          onRetry={() => this.setState({ error: null })}
        />
      )
    }
    return this.props.children
  }
}

function ZeroErrorFallback({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <YStack flex={1} items="center" justify="center" gap="$4" px="$6">
      <SizableText size="$7" fontWeight="700" color="$color12">
        Sync Error
      </SizableText>
      <SizableText size="$4" color="$color10" text="center">
        {error.message}
      </SizableText>
      <Button size="large" theme="accent" onPress={onRetry}>
        Retry
      </Button>
    </YStack>
  )
}

export const ProvideZero = ({ children }: { children: ReactNode }) => (
  <ZeroErrorBoundary>
    <ProvideZeroImpl>{children}</ProvideZeroImpl>
  </ZeroErrorBoundary>
)

// module-level so they survive remounts and zero instance swaps
let lastConnectionState: 'disconnected' | 'connected' | 'idle' = 'idle'

const announceDisconnected = debounce(() => {
  if (lastConnectionState !== 'disconnected') return
  showToast(`Disconnected!`, {
    type: 'error',
  })
}, 3000)

let hasEverConnected = false

// refresh the better-auth session and resume zero when zero-cache rejected our
// auth (expired token). ZeroProvider only auto-resumes when the auth string
// CHANGES, so an expired token strands the run loop in needs-auth until we
// manually reconnect with a fresh token.
const recoverNeedsAuth = async (zero: ReturnType<typeof useZero>) => {
  const { data } = await authClient.getSession()
  const token = data?.session?.token
  if (token) {
    await zero.connection.connect({ auth: token })
  }
}

const ZeroConnectionMonitor = () => {
  // must use useConnectionState (not the module-level zero proxy): ZeroProvider
  // recreates the zero instance on userID/auth changes (anon -> authed on every
  // authed page load), and a proxy subscription stays bound to the dead instance.
  const connectionState = useConnectionState()
  const zero = useZero()
  const needsAuthAttempted = useRef(false)

  useEffect(() => {
    const reason =
      'reason' in connectionState && typeof connectionState.reason === 'string'
        ? connectionState.reason
        : ''

    if (typeof document !== 'undefined') {
      document.body.dataset.zeroState = connectionState.name
      if (reason) {
        document.body.dataset.zeroReason = reason.slice(0, 200)
      } else {
        delete document.body.dataset.zeroReason
      }
    }

    if (process.env.NODE_ENV === 'development' || process.env.IS_TESTING === '1') {
      console.info(
        `[zero] connection ${connectionState.name}`,
        reason ? `reason=${reason}` : '',
      )
    }

    if (connectionState.name !== 'needs-auth') {
      needsAuthAttempted.current = false
    }

    if (connectionState.name === 'connected') {
      announceDisconnected.cancel()
      if (hasEverConnected && lastConnectionState === 'disconnected') {
        showToast(`Re-connected!`)
      }
      hasEverConnected = true
      lastConnectionState = 'connected'
      // signal readiness for e2e tests waiting on zero sync
      if (typeof document !== 'undefined') {
        document.body.dataset.zeroConnected = 'true'
      }
      return
    }

    if (connectionState.name === 'needs-auth') {
      if (typeof document !== 'undefined') {
        delete document.body.dataset.zeroConnected
      }
      // attempt recovery at most once per transition into needs-auth
      if (!needsAuthAttempted.current) {
        needsAuthAttempted.current = true
        recoverNeedsAuth(zero).catch((error: unknown) => {
          console.warn('[zero] needs-auth recovery failed', error)
        })
      }
      return
    }

    if (
      connectionState.name === 'disconnected' ||
      connectionState.name === 'error' ||
      connectionState.name === 'closed'
    ) {
      lastConnectionState = 'disconnected'
      if (typeof document !== 'undefined') {
        delete document.body.dataset.zeroConnected
      }
      if (hasEverConnected) {
        announceDisconnected()
      }
      return
    }
  }, [connectionState, zero])

  useEffect(() => {
    return zeroEvents.listen((event) => {
      console.warn('zero event', event)
    })
  }, [])

  return null
}

const ZeroDebug = memo(() => {
  const zero = useZero()

  useEffect(() => {
    setDevGlobal(zero, 'zero')
    setDevGlobal(run, 'run')
    setDevGlobal(userByUsername, 'userByUsername')
    setDevGlobal(dropAllDatabases, 'dropAllDatabases')
  }, [zero])

  return null
})
