/**
 * Better-auth helpers for React / React Native applications
 *
 * Features:
 *  - JWT support (for Zero, Tauri, React Native)
 *  - Session persistence in local storage
 *  - Token validation and refresh
 *  - State management with emitters
 *  - Automatic retry on errors
 */

import {
  createEmitter,
  createLocalStorageValue,
  type Emitter,
  isEqualDeepLite,
  useEmitterValue,
} from '@take-out/helpers'
import { type BetterAuthClientOptions, createAuthClient } from 'better-auth/client'

import type { Session, User } from 'better-auth'

export interface StorageKeys {
  token: string
  session: string
}

export type AuthState<U extends User = User> = {
  state: 'loading' | 'logged-in' | 'logged-out'
  session: Session | null
  user: U | null
  token: string | null
}

export interface BetterAuthClientProps<
  TUser extends User = User,
> extends BetterAuthClientOptions {
  /**
   * Callback to transform and type the user object
   * This allows you to add app-specific fields and ensure proper typing
   * @default (user) => user
   */
  createUser?: (user: User) => TUser
  /**
   * Optional callback when authentication state changes
   */
  onAuthStateChange?: (state: AuthState<TUser>) => void
  /**
   * Optional callback for handling auth errors
   */
  onAuthError?: (error: any) => void
  /**
   * Storage key prefix for local storage
   * @default 'auth'
   */
  storagePrefix?: string
  /**
   * Retry delay in milliseconds after auth errors
   * @default 4000
   */
  retryDelay?: number
  /**
   * Custom token validation endpoint
   * @default '/api/auth/validateToken'
   */
  tokenValidationEndpoint?: string
}

export interface BetterAuthClientReturn<U extends User = User, TClient = any> {
  clearState: () => void
  authState: ReturnType<typeof createEmitter<AuthState<U>>>
  authClient: TClient
  setAuthClientToken: (props: { token: string; session: string }) => Promise<void>
  clearAuthClientToken: () => void
  useAuth: () => AuthState<U>
  getAuth: () => AuthState<U> & { loggedIn: boolean }
  getValidToken: () => Promise<string | undefined>
  updateAuthClient: (session: string) => void
  authClientVersion: Emitter<number>
}

type InferUser<T> = T extends { createUser?: (user: User) => infer R }
  ? R extends User
    ? R
    : User
  : User

export function createBetterAuthClient<const Opts extends BetterAuthClientProps<any>>(
  options: Opts
): BetterAuthClientReturn<InferUser<Opts>, ReturnType<typeof createAuthClient<Opts>>> {
  type TUser = InferUser<Opts>
  const {
    onAuthStateChange,
    onAuthError,
    createUser,
    storagePrefix = 'auth',
    retryDelay = 4000,
    tokenValidationEndpoint = '/api/auth/validateToken',
    ...authClientOptions
  } = options

  const empty: AuthState<TUser> = {
    state: 'logged-out',
    session: null,
    user: null,
    token: null,
  }

  const createAuthClientWithSession = (session: string) => {
    return createAuthClient({
      ...authClientOptions,
      fetchOptions: {
        headers: {
          Authorization: `Bearer ${session}`,
        },
      },
    })
  }

  const keysStorage = createLocalStorageValue<StorageKeys>(`${storagePrefix}-keys`)
  const stateStorage = createLocalStorageValue<AuthState<TUser>>(`${storagePrefix}-state`)

  let authClient = (() => {
    const existingSession = keysStorage.get()?.session
    return existingSession
      ? createAuthClientWithSession(existingSession)
      : createAuthClient(authClientOptions as Opts)
  })()

  const authState = createEmitter<AuthState<TUser>>(
    'authState',
    stateStorage.get() || empty,
    {
      comparator: isEqualDeepLite,
    }
  )

  const authClientVersion = createEmitter<number>('authClientVersion', 0)

  const setState = (update: Partial<AuthState<TUser>>) => {
    const current = authState.value!
    const next = { ...current, ...update }
    stateStorage.set(next)
    authState.emit(next)

    // update storage keys
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

    // call optional callback
    onAuthStateChange?.(next)
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
  let retryTimer: ReturnType<typeof setTimeout> | null = null

  function subscribeToAuthEffect() {
    dispose?.()

    dispose = authClient.useSession.subscribe(async (props) => {
      const { data: dataGeneric, isPending, error } = props

      if (error) {
        onAuthError?.(error)
        // retry by re-subscribing after a delay to recover from transient errors
        scheduleAuthRetry(retryDelay)
        return
      }

      const data = dataGeneric as
        | undefined
        | {
            session?: AuthState<TUser>['session']
            user?: AuthState<TUser>['user']
          }

      setState({
        state: isPending ? 'loading' : data?.session ? 'logged-in' : 'logged-out',
        session: data?.session,
        user: data?.user
          ? createUser
            ? createUser(data.user as User)
            : (data.user as any)
          : null,
      })

      // get token on creating a new session (for native + tauri)
      if (data?.session && !authState.value.token) {
        getValidToken().then((token) => {
          if (token) {
            setState({ token })
          }
        })
      }
    })
  }

  function scheduleAuthRetry(delayMs: number) {
    if (retryTimer) {
      clearTimeout(retryTimer)
    }
    retryTimer = setTimeout(() => {
      retryTimer = null
      subscribeToAuthEffect()
    }, delayMs)
  }

  async function getValidToken(): Promise<string | undefined> {
    const existing = keysStorage.get()?.token

    if (existing) {
      try {
        const response = await fetch(tokenValidationEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: existing,
          }),
        }).then((res) => res.json())

        if (response?.valid) {
          return existing
        }
      } catch (error) {
        console.error('Error validating token:', error)
      }
    }

    const res = await authClient.$fetch('/token')
    if (res.error) {
      console.error(`Error fetching token: ${res.error.statusText}`)
      return undefined
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
  }

  // initialize subscription
  subscribeToAuthEffect()

  // cleanup on unmount
  if (typeof window !== 'undefined' && window.addEventListener) {
    const cleanup = () => {
      dispose?.()
      if (retryTimer) {
        clearTimeout(retryTimer)
      }
    }
    window.addEventListener('beforeunload', cleanup)
  }

  const proxiedAuthClient = new Proxy(authClient, {
    get(_target, key) {
      if (key === 'signOut') {
        return async () => {
          clearState()
          // @ts-expect-error better-auth type issue, signOut does exist
          await authClient.signOut?.()
          // force refresh to clear any remaining state
          if (typeof window !== 'undefined') {
            window.location?.reload?.()
          }
        }
      }
      // ensure always latest authClient after login
      return Reflect.get(authClient, key)
    },
  }) as ReturnType<typeof createAuthClient<Opts>>

  return {
    authClientVersion,
    clearState,
    authState,
    authClient: proxiedAuthClient,
    setAuthClientToken,
    clearAuthClientToken,
    useAuth,
    getAuth,
    getValidToken,
    updateAuthClient,
  }
}
