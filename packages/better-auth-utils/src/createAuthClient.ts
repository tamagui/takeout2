/**
 * Better-auth helpers for React / React Native applications
 *
 * Features:
 *  - Session persistence in local storage
 *  - State management with emitters
 *  - Automatic retry on errors
 *  - Optional JWT support (for Tauri, React Native)
 */

import {
  createEmitter,
  createStorageValue,
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
  /** JWT token - only populated when useJWT is enabled */
  token: string | null
}

export interface BetterAuthClientProps<
  TUser extends User = User,
> extends BetterAuthClientOptions {
  /**
   * Callback to transform and type the user object
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
   * Enable JWT token management for native apps (Tauri, React Native)
   * When false (default), auth uses session cookies forwarded by the server
   * When true, fetches and manages JWT tokens for Authorization header auth
   * @default false
   */
  useJWT?: boolean

  /**
   * Cookie names to clear on auth invalidation
   * @default ['better-auth.jwt', 'better-auth.session_token']
   */
  authCookieNames?: string[]
}

export interface BetterAuthClientReturn<U extends User = User, TClient = any> {
  clearState: () => void
  authState: ReturnType<typeof createEmitter<AuthState<U>>>
  authClient: TClient
  setAuthClientToken: (props: { token: string; session: string }) => Promise<void>
  clearAuthClientToken: () => void
  clearAllAuth: () => void
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
    useJWT = false,
    authCookieNames = ['better-auth.jwt', 'better-auth.session_token'],
    ...authClientOptions
  } = options

  const empty: AuthState<TUser> = {
    state: 'logged-out',
    session: null,
    user: null,
    token: null,
  }

  const keysStorage = createStorageValue<StorageKeys>(`${storagePrefix}-keys`)
  const stateStorage = createStorageValue<AuthState<TUser>>(`${storagePrefix}-state`)

  const createAuthClientWithSession = (session: string) => {
    return createAuthClient({
      ...authClientOptions,
      fetchOptions: {
        credentials: 'include',
        headers: session ? { Authorization: `Bearer ${session}` } : undefined,
      },
    })
  }

  let authClient = (() => {
    const existingSession = keysStorage.get()?.session
    return existingSession
      ? createAuthClientWithSession(existingSession)
      : createAuthClient({
          ...authClientOptions,
          fetchOptions: { credentials: 'include' },
        } as Opts)
  })()

  const authState = createEmitter<AuthState<TUser>>(
    'authState',
    stateStorage.get() || empty,
    { comparator: isEqualDeepLite }
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
    } else if (next.session) {
      keysStorage.set({
        token: '',
        session: next.session.token,
      })
    } else {
      keysStorage.set({ token: '', session: '' })
    }

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
        scheduleAuthRetry(retryDelay)
        return
      }

      const data = dataGeneric as
        | undefined
        | {
            session?: AuthState<TUser>['session']
            user?: AuthState<TUser>['user']
          }

      // if we have a persisted session but server hasn't confirmed yet, stay loading
      const hasPersistedSession = !!keysStorage.get()?.session
      const nextState = isPending
        ? 'loading'
        : data?.session
          ? 'logged-in'
          : hasPersistedSession && data === undefined
            ? 'loading'
            : 'logged-out'

      // only update session/user when we have definitive data
      const sessionUpdate =
        nextState === 'loading'
          ? {}
          : {
              session: data?.session ?? null,
              user: data?.user ? (createUser ? createUser(data.user) : data.user) : null,
            }

      // detect new session
      const previousSession = authState.value?.session
      const isNewSession =
        data?.session &&
        (!previousSession ||
          previousSession.id !== data.session.id ||
          previousSession.userId !== data.session.userId)

      setState({
        state: nextState,
        ...sessionUpdate,
      })

      // fetch JWT token when useJWT is enabled (for native/tauri apps)
      if (useJWT && data?.session && (isNewSession || !authState.value.token)) {
        if (isNewSession && authState.value.token) {
          setState({ token: null })
        }

        getValidToken().then((token) => {
          if (token) {
            setState({ token })
          }
        })
      }
    })
  }

  function scheduleAuthRetry(delayMs: number) {
    if (retryTimer) clearTimeout(retryTimer)
    retryTimer = setTimeout(() => {
      retryTimer = null
      subscribeToAuthEffect()
    }, delayMs)
  }

  async function getValidToken(): Promise<string | undefined> {
    const res = await authClient.$fetch('/token')
    if (res.error) {
      console.error(`Error fetching token: ${res.error.statusText}`)
      return undefined
    }
    return (res.data as any)?.token as string | undefined
  }

  const clearAuthClientToken = () => {
    keysStorage.remove()
  }

  function clearAuthCookies() {
    if (typeof document === 'undefined') return

    for (const cookieName of authCookieNames) {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
      const domain = window.location.hostname
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain}`
      if (domain.startsWith('.')) {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain.slice(1)}`
      }
    }
  }

  function clearAllAuth() {
    clearAuthCookies()
    clearState()
  }

  const getAuth = () => {
    const state = authState?.value || empty
    return { ...state, loggedIn: !!state.session }
  }

  const useAuth = () => {
    return useEmitterValue(authState) || empty
  }

  function clearState() {
    keysStorage.remove()
    stateStorage.remove()
    setState(empty)
  }

  subscribeToAuthEffect()

  if (typeof window !== 'undefined' && window.addEventListener) {
    const cleanup = () => {
      dispose?.()
      if (retryTimer) clearTimeout(retryTimer)
    }
    window.addEventListener('beforeunload', cleanup)
  }

  const proxiedAuthClient = new Proxy(authClient, {
    get(_target, key) {
      if (key === 'signOut') {
        return () => {
          clearState()
          // @ts-expect-error better-auth type issue
          authClient.signOut?.()
          if (typeof window !== 'undefined') {
            window.location?.reload?.()
          }
        }
      }
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
    clearAllAuth,
    useAuth,
    getAuth,
    getValidToken,
    updateAuthClient,
  }
}
