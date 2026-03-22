import { useZero } from '@rocicorp/zero/react'
import { createZeroClient, run } from 'on-zero'
import {
  Component,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { debounce } from 'tamagui'

import { dropAllDatabases } from '@rocicorp/zero'
import { ZERO_SERVER_URL } from '~/constants/urls'
import * as groupedQueries from '~/data/generated/groupedQueries'
import { models } from '~/data/generated/models'
import { userByUsername } from '~/data/queries/user'
import { schema } from '~/data/schema'
import { useAuth } from '~/features/auth/client/authClient'
import { setDevGlobal } from '~/features/devtools/devGlobal'
import { showToast } from '~/interface/toast/Toast'
import { unstable_batchedUpdates } from './batchUpdates'
import {
  resetShownClientDataError,
  showClientDataErrorOnce,
} from './helpers/showClientDataError'
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
  const [zeroDisabledByError, setZeroDisabledByError] = useState(false)

  // stabilize authData across auth transitions to prevent mutations from
  // seeing null during brief re-render gaps (e.g. session refresh, tab wake)
  const stableAuthDataRef = useRef(auth.authData)
  if (auth.authData) {
    stableAuthDataRef.current = auth.authData
  }
  const stableAuthData = auth.authData ?? stableAuthDataRef.current

  const disable = !auth?.user?.email || zeroDisabledByError

  const kvStore = useMemo(() => createKVStore(userId), [userId])

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.info(`[zero] ${disable ? 'disabled' : 'enabled'}`, {
        userId,
        ZERO_SERVER_URL,
        kvStore,
      })
    }
  }, [disable, userId, kvStore])

  useEffect(() => {
    if (!zeroDisabledByError) {
      resetShownClientDataError('zero-client-state-not-found')
      resetShownClientDataError('zero-update-needed')
    }
  }, [zeroDisabledByError])

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
      onClientStateNotFound={useCallback((reason?: string) => {
        const description =
          reason ||
          'The local data needed to keep this page in sync is no longer available.'
        console.error('[zero] client state not found', { reason: description })
        setZeroDisabledByError(true)
        showClientDataErrorOnce({
          key: 'zero-client-state-not-found',
          title: 'Sync Error',
          description,
        })
      }, [])}
      onUpdateNeeded={useCallback((reason?: { type?: string; message?: string }) => {
        const description = [
          'A local sync update is required before this page can continue.',
          reason?.message,
        ]
          .filter(Boolean)
          .join(' ')
        console.error('[zero] update needed', reason)
        setZeroDisabledByError(true)
        showClientDataErrorOnce({
          key: 'zero-update-needed',
          title: 'Sync Error',
          description,
        })
      }, [])}
    >
      {children}
      <ZeroDebug />
      <ZeroConnectionMonitor />
    </ProvideZeroWithoutAuth>
  )
}

// error boundary to catch and log what's crashing inside ProvideZero
class ZeroErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
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
      // render fallback (children without zero) so app still works
      return this.props.fallback
    }
    return this.props.children
  }
}

export const ProvideZero = ({ children }: { children: ReactNode }) => (
  <ZeroErrorBoundary fallback={children}>
    <ProvideZeroImpl>{children}</ProvideZeroImpl>
  </ZeroErrorBoundary>
)

let lastConnectionState: 'disconnected' | 'connected' | 'idle' = 'idle'

const announceDisconnected = debounce(() => {
  if (lastConnectionState !== 'disconnected') return
  showToast(`Disconnected!`, {
    type: 'error',
  })
}, 3000)

let hasEverConnected = false

const ZeroConnectionMonitor = () => {
  useEffect(() => {
    const unsub1 = zero.connection.state.subscribe((connectionState) => {
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
    })

    const unsub2 = zeroEvents.listen((event) => {
      console.warn('zero event', event)
    })

    return () => {
      unsub1()
      unsub2()
    }
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
