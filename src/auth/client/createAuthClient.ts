/**
 *
 * better-auth helpers:
 *
 *  - React / React Native
 *  - JWT (for zero, tauri, RN)
 *  - Fix a few better-auth quirks
 *  - Store session + jwt in local storage
 *
 *  TODO: needs love, especially stale/invalidation/refresh
 *
 */

import {
  createEmitter,
  createLocalStorageValue,
  createUseEmitter,
  isEqualDeepLite,
  useEmitterValue,
} from '@vxrn/helpers'
import type { Session, User } from 'better-auth'
import { type BetterAuthClientOptions, createAuthClient } from 'better-auth/client'
import { setUser } from '~/features/user/getUser'
import { showToast } from '~/interface/toast/Toast'

interface StorageKeys {
  token: string
  session: string
}

export type AuthState = {
  state: 'loading' | 'logged-in' | 'logged-out'
  session: Session | null
  // role does exist but better auth doesnt type it
  user: (User & { role?: 'admin' }) | null
  token: string | null
}

const empty: AuthState = {
  state: 'logged-out',
  session: null,
  user: null,
  token: null,
}

export function createBetterAuthClient<Opts extends BetterAuthClientOptions>(
  options: Opts
) {
  const createAuthClientWithSession = (session: string) => {
    return createAuthClient({
      ...options,
      fetchOptions: {
        headers: {
          Authorization: `Bearer ${session}`,
        },
      },
    })
  }

  const keysStorage = createLocalStorageValue<StorageKeys>('auth-keys')
  const stateStorage = createLocalStorageValue<AuthState>('auth-state')

  let authClient = (() => {
    const existingSession = keysStorage.get()?.session
    return existingSession
      ? createAuthClientWithSession(existingSession)
      : createAuthClient(options)
  })()

  let hasCalledBackOnce = false

  const authState = createEmitter<AuthState>('authState', stateStorage.get() || empty, {
    comparator: isEqualDeepLite,
  })
  const authClientVersion = createEmitter<number>('authClientVersion', 0)
  const useAuthClientVersion = createUseEmitter(authClientVersion)

  const setState = (update: Partial<AuthState>) => {
    // console.info(`[better-auth] setState`, update)
    const current = authState.value!
    const next = { ...current, ...update }
    stateStorage.set(next)
    authState.emit(next)
    if (next.token && next.session) {
      keysStorage.set({
        token: next.token,
        session: next.session.token,
      })
    } else {
      keysStorage.set({
        token: '',
        session: '',
      })
    }
  }

  const setAuthClientToken = async (props: { token: string; session: string }) => {
    keysStorage.set(props)
    updateAuthClient(props.session)
  }

  function updateAuthClient(session: string) {
    authClient = createAuthClientWithSession(session)
    authClientVersion.emit(Math.random())
    subscribeToAuthEffect()
  }

  let dispose: Function | null = null
  function subscribeToAuthEffect() {
    dispose?.()

    dispose = authClient.useSession.subscribe(async (props) => {
      // console.info(`[auth]`, props, authState.value)

      const { data: dataGeneric, isPending, error } = props

      if (error) {
        showToast(`Auth error: ${error.message || JSON.stringify(error)}`, {
          type: 'error',
        })
        // Retry by re-subscribing after a short delay to recover from transient errors
        scheduleAuthRetry(4000)
        return
      }

      const data = dataGeneric as
        | undefined
        | {
            session?: AuthState['session']
            user?: AuthState['user']
          }

      setState({
        state: isPending ? 'loading' : data?.session ? 'logged-in' : 'logged-out',
        session: data?.session,
        user: data?.user,
      })

      // always get token on creating a new session
      // likely we can avoid doing this always? we only use it for native + tauri
      if (data?.session && !authState.value.token) {
        getValidToken().then((token) => {
          setState({ token })
        })
      }
    })
  }

  subscribeToAuthEffect()

  // debounce timer for retrying subscription after errors
  let retryTimer: ReturnType<typeof setTimeout> | null = null
  function scheduleAuthRetry(delayMs = 2000) {
    if (retryTimer) {
      clearTimeout(retryTimer)
    }
    retryTimer = setTimeout(() => {
      retryTimer = null
      subscribeToAuthEffect()
    }, delayMs)
  }

  async function getValidToken() {
    const existing = keysStorage.get()?.token

    if (existing) {
      const response = await fetch(`/api/auth/validateToken`, {
        method: 'POST',
        body: JSON.stringify({
          token: existing,
        }),
      }).then((res) => res.json())

      if (response?.valid) {
        return existing
      }
    }

    const res = await authClient.$fetch('/token')
    if (res.error) {
      console.error(`Error fetching token ${res.error.statusText}`)
      return
    }
    const data = res.data as any
    return data?.token as string | undefined
  }

  const clearAuthClientToken = () => {
    keysStorage.remove()
  }

  const getAuth = () => {
    const state = authState?.value || empty
    return {
      ...state,
      loggedIn: !!state.session,
    }
  }

  const useAuth = () => {
    return useEmitterValue(authState) || empty
  }

  function clearState() {
    keysStorage.clear()
    stateStorage.clear()
    setState(empty)
    setUser(null)
  }

  const response = {
    clearState,
    authState,
    authClient: new Proxy(authClient, {
      get(_target, key) {
        if (key === 'signOut') {
          return () => {
            clearState()
            // @ts-expect-error bad type on better-auth, it does always exist
            authClient.signOut()
            // useSession doesn't clear
            window?.location?.reload?.()
            return
          }
        }

        // ensure always latest authClient after login
        return Reflect.get(authClient, key)
      },
    }),
    setAuthClientToken,
    clearAuthClientToken,
    useAuthClientVersion,
    useAuth,
    getAuth,
    getValidToken,
    updateAuthClient,
  }

  return response
}
