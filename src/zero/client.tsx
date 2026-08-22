import { useConnectionState, useZero } from '@rocicorp/zero/react'
import { createZeroClient, run } from 'on-zero'
import { Component, memo, useEffect, useMemo, type ReactNode } from 'react'
import { debounce, SizableText, YStack } from 'tamagui'

import { Button } from '~/interface/buttons/Button'

import { dropAllDatabases } from '@rocicorp/zero'
import { ZERO_SERVER_URL } from '~/constants/urls'
import * as groupedQueries from '~/data/generated/groupedQueries'
import { models } from '~/data/generated/models'
import { userByUsername } from '~/data/user/queries'
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
      authData={auth.authData}
      cacheURL={ZERO_SERVER_URL}
      connectionDataset
      refreshAuth={async () => {
        // zero-cache rejected our token (expired); hand back a fresh one so
        // on-zero reconnects in place instead of stranding the run loop in
        // needs-auth (it only auto-resumes when the auth string changes).
        const { data } = await authClient.getSession()
        return data?.session?.token
      }}
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

// takeout-specific reconnect UX. dataset bookkeeping + needs-auth token refresh
// now live in on-zero's ConnectionMonitor (via connectionDataset + refreshAuth);
// this only owns the disconnect/reconnect toasts.
const ZeroConnectionMonitor = () => {
  // must use useConnectionState (not the module-level zero proxy): ZeroProvider
  // recreates the zero instance on userID/auth changes (anon -> authed on every
  // authed page load), and a proxy subscription stays bound to the dead instance.
  const connectionState = useConnectionState()

  useEffect(() => {
    if (connectionState.name === 'connected') {
      announceDisconnected.cancel()
      if (hasEverConnected && lastConnectionState === 'disconnected') {
        showToast(`Re-connected!`)
      }
      hasEverConnected = true
      lastConnectionState = 'connected'
      return
    }

    if (
      connectionState.name === 'disconnected' ||
      connectionState.name === 'error' ||
      connectionState.name === 'closed'
    ) {
      lastConnectionState = 'disconnected'
      if (hasEverConnected) {
        announceDisconnected()
      }
      return
    }
  }, [connectionState])

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
