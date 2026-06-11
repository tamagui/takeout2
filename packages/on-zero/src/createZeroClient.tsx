import { defineQueries, defineQuery, Zero as ZeroClient } from '@rocicorp/zero'
import { useConnectionState, useZero, ZeroProvider } from '@rocicorp/zero/react'
import { createEmitter, useEmitterValue } from '@take-out/helpers'
import {
  createContext,
  memo,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { createPermissions } from './createPermissions'
import { createUseQuery, type QueryControlMode } from './createUseQuery'
import { createMutators } from './helpers/createMutators'
import { getAuth } from './helpers/getAuth'
import { getAllMutationsPermissions, getMutationsPermissions } from './modelRegistry'
import { registerQuery } from './queryRegistry'
import { resolveQuery, type PlainQueryFn } from './resolveQuery'
import { setCustomQueries } from './run'
import { getEnvironment, setAuthData, setEnvironment, setSchema } from './state'
import { getRawWhere, setEvaluatingPermission } from './where'
import { setRunner } from './zeroRunner'
import { zql } from './zql'

import type { AuthData, GenericModels, GetZeroMutators, ZeroEvent } from './types'
import type { Query, Row, Zero, ZeroOptions, Schema as ZeroSchema } from '@rocicorp/zero'

type PreloadOptions = { ttl?: 'always' | 'never' | number | undefined }

export type GroupedQueries = Record<string, Record<string, (...args: any[]) => any>>

// controls how usePermission behaves before the server responds:
//  - 'optimistic': evaluate the permission query on the client (default)
//  - 'optimistic-deny': return false until server confirms
//  - 'optimistic-allow': return true until server confirms
export type PermissionStrategy = 'optimistic' | 'optimistic-deny' | 'optimistic-allow'

function getZeroProxyValue(instance: object, key: PropertyKey) {
  const value = Reflect.get(instance, key, instance)
  if (typeof value !== 'function') return value

  const bound = value.bind(instance)
  for (const property of Reflect.ownKeys(value)) {
    if (property === 'length' || property === 'name' || property === 'prototype') {
      continue
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, property)
    if (descriptor) {
      Object.defineProperty(bound, property, descriptor)
    }
  }
  return bound
}

export function createZeroClient<
  Schema extends ZeroSchema,
  Models extends GenericModels,
>({
  schema,
  models,
  groupedQueries,
  permissionStrategy = 'optimistic',
}: {
  schema: Schema
  models: Models
  groupedQueries: GroupedQueries
  permissionStrategy?: PermissionStrategy
}) {
  type ZeroMutators = GetZeroMutators<Models>
  type ZeroInstance = Zero<Schema, ZeroMutators>
  type TableName = keyof Schema['tables'] & string

  setSchema(schema)

  // only set environment to 'client' if server hasn't already claimed it
  // (during SSR, createZeroServer runs first and sets 'server')
  if (getEnvironment() === null) {
    setEnvironment('client')
  }

  const permissionsHelpers = createPermissions<Schema>({
    schema,
    environment: 'client',
  })

  // build query registry from grouped queries
  // this creates ONE shared defineQueries registry that matches the server's structure
  const wrappedNamespaces: Record<
    string,
    Record<string, ReturnType<typeof defineQuery>>
  > = {}

  for (const [namespace, queries] of Object.entries(groupedQueries)) {
    wrappedNamespaces[namespace] = {}
    for (const [name, fn] of Object.entries(queries)) {
      registerQuery(fn, `${namespace}.${name}`)
      // wrap each plain function in defineQuery
      wrappedNamespaces[namespace][name] = defineQuery(({ args }: { args: any }) =>
        fn(args),
      )
    }
  }

  // register per-model permission queries so each table gets its own materialized view
  // client: evaluates raw permission condition for optimistic result
  // server: evaluates real permission condition authoritatively
  const permissionCheckFns: Record<
    string,
    (args: { objOrId: string | Record<string, any> }) => any
  > = {}

  const createPermissionCheckFn = (table: string) => {
    const fn = (args: { objOrId: string | Record<string, any> }) => {
      const perm = getMutationsPermissions(table)
      const base = (zql as any)[table]

      if (!args.objOrId) {
        return base.where((eb: any) => eb.cmpLit(true, '=', false)).one()
      }

      if (permissionStrategy === 'optimistic') {
        // unwrap serverWhere so conditions actually evaluate on client
        // set flag so nested serverWhere calls also bypass the client no-op
        const rawPerm = perm ? getRawWhere(perm) || perm : perm
        return base
          .where((eb: any) => {
            setEvaluatingPermission(true)
            try {
              return permissionsHelpers.buildPermissionQuery(
                getAuth(),
                eb,
                rawPerm || ((e: any) => e.and()),
                args.objOrId,
                table,
              )
            } finally {
              setEvaluatingPermission(false)
            }
          })
          .one()
      }

      if (permissionStrategy === 'optimistic-deny') {
        // client query always returns false, server corrects authoritatively
        return base.where((eb: any) => eb.cmpLit(true, '=', false)).one()
      }

      // optimistic-allow: pass wrapped perm directly
      // serverWhere is a no-op on client → eb.and() → always true → row exists check
      // server evaluates real condition and corrects authoritatively
      return base
        .where((eb: any) => {
          return permissionsHelpers.buildPermissionQuery(
            getAuth(),
            eb,
            perm || ((e: any) => e.and()),
            args.objOrId,
            table,
          )
        })
        .one()
    }
    permissionCheckFns[table] = fn
    registerQuery(fn, `permission.${table}`)
    return fn
  }

  wrappedNamespaces['permission'] = {}
  for (const [table] of getAllMutationsPermissions()) {
    const fn = createPermissionCheckFn(table)
    wrappedNamespaces['permission'][table] = defineQuery(({ args }: any) => fn(args))
  }

  // create the single shared CustomQuery registry
  const customQueries = defineQueries(wrappedNamespaces)

  // register for global run() helper
  setCustomQueries(customQueries)

  const DisabledContext = createContext<QueryControlMode>(false)

  let latestZeroInstance: ZeroInstance | null = null

  // Proxy allows swapping the Zero instance on login without breaking existing references.
  // Ideally rocicorp/zero would support .setAuth() natively, but for now we swap instances.
  const zero: ZeroInstance = new Proxy({} as never, {
    get(_, key) {
      if (latestZeroInstance === null) {
        throw new Error(
          `Zero instance not initialized. Ensure ZeroProvider is mounted before accessing 'zero'.`,
        )
      }
      return getZeroProxyValue(latestZeroInstance, key)
    },
  })

  const zeroEvents = createEmitter<ZeroEvent | null>('zero', null)

  const AuthDataContext = createContext<AuthData>({} as AuthData)

  const useQuery = createUseQuery<Schema>({
    DisabledContext,
    customQueries,
  })

  // permission check uses a per-model synced query so server is authoritative
  // permissionStrategy controls client behavior before server responds
  function usePermission(
    table: TableName | (string & {}),
    objOrId: string | Partial<Row<any>> | undefined,
    enabled = typeof objOrId !== 'undefined',
    debug = false,
  ): boolean | null {
    const disableMode = useContext(DisabledContext)
    const lastRef = useRef<boolean | null>(null)
    const tableStr = table as string
    const checkFn = permissionCheckFns[tableStr]

    // include auth user ID in query args so zero-cache creates per-user
    // permission views (prevents dedup across different auth contexts)
    const auth = getAuth()
    const _uid = auth?.id || 'anon'

    const [data, status] = useQuery(
      checkFn as any,
      { objOrId: objOrId as any, _uid },
      { enabled: Boolean(!disableMode && enabled && objOrId && checkFn) },
    )

    if (debug) {
      console.info(`usePermission()`, { table, objOrId, data, status })
    }

    if (!objOrId) return false

    // null while loading, then server's authoritative answer
    const result = status.type === 'unknown' ? null : Boolean(data)

    if (!disableMode) {
      lastRef.current = result
      return result
    }

    if (disableMode === 'last-value') {
      return lastRef.current
    }

    return null
  }

  // the zero instance lives OUTSIDE the react lifecycle. react destroys and
  // re-fires the effects of a committed tree on any suspense hide/reveal, and
  // consumers also remount the provider (splash -> IDE). when ZeroProvider
  // created zero inside its own effect, every such cycle closed the live
  // instance mid-connect ("Failed to connect / Store is closed") and built a
  // replacement, killing in-flight queries and preloads. instead the instance
  // is created in an effect, cached here per identity key, handed to
  // ZeroProvider as an external `zero` (which it never closes), and the
  // previous instance is closed only when the key truly changes — a real
  // identity change (user, storage, server, logged in/out), never a react
  // lifecycle artifact. single-provider assumption: one mounted ProvideZero
  // per client (true of every consumer); two simultaneously mounted providers
  // with different identities would thrash this slot.
  let cachedZero: { key: string; instance: ZeroInstance } | null = null

  // bumping this recreates the instance with the same options — parity with
  // ZeroProvider's built-in onClientStateNotFound rotation. the pending flag
  // mirrors upstream's rotationPendingRef: a storm of client-state-not-found
  // callbacks coalesces into ONE rotation, re-armed when the fresh instance
  // is created — without it a new instance that immediately re-fires the
  // callback rotation-loops forever.
  const zeroInstanceGeneration = createEmitter<number>('zero-instance-generation', 0)
  let zeroRotationPending = false

  const ProvideZero = ({
    children,
    authData: authDataIn,
    disable,
    ...props
  }: Omit<ZeroOptions<Schema, ZeroMutators>, 'schema' | 'mutators'> & {
    children: ReactNode
    authData?: AuthData | null
    disable?: boolean
  }) => {
    const authData = (authDataIn ?? null) as AuthData

    // update global authData synchronously during render so mutations always have latest auth
    // (mutations read auth dynamically via getAuthData() to avoid stale closure race condition)
    setAuthData(authData)

    // mutators are stable — auth is read dynamically via getAuthData() at mutation
    // time, so we don't need to recreate them (or the Zero instance) on auth change.
    // setAuthData() above already ensures getAuthData() returns current auth.
    const mutators = useMemo(() => {
      return createMutators({
        models,
        environment: 'client',
        authData: null,
        can: permissionsHelpers.can,
      })
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const generation = useEmitterValue(zeroInstanceGeneration)

    const auth = 'auth' in props ? (props as { auth?: string | null }).auth : undefined
    const hasAuth = typeof auth === 'string'

    // identity = every primitive option except the auth token value (token
    // changes refresh in place below; logged-in <-> logged-out still rotates
    // via hasAuth, matching zero's documented provider semantics). function
    // props (callbacks, logSink, batchViewUpdates) are bound at construction.
    const instanceKey = JSON.stringify([
      Object.entries({ kvStore: 'mem', ...props })
        .filter(
          ([key, value]) =>
            key !== 'auth' && typeof value !== 'function' && value !== undefined,
        )
        .sort(([a], [b]) => (a < b ? -1 : 1)),
      hasAuth,
      generation,
    ])

    // create/rotate in an effect — commit-safe: a discarded concurrent render
    // can never close an instance the committed tree still uses. a suspense
    // hide/reveal re-runs this effect with an unchanged key — cache hit, no
    // churn, no cleanup-close. children mounting one effect-tick after the
    // provider matches ZeroProvider's internal-creation timing, which consumer
    // boot orchestration observes.
    const [instance, setInstance] = useState<ZeroInstance | undefined>()
    useEffect(() => {
      let cached = cachedZero
      if (cached?.key !== instanceKey) {
        cached?.instance.close()
        const options = props as Omit<
          ZeroOptions<Schema, ZeroMutators>,
          'schema' | 'mutators'
        >
        cached = {
          key: instanceKey,
          instance: new ZeroClient<Schema, ZeroMutators>({
            kvStore: 'mem',
            ...options,
            schema,
            // @ts-expect-error same erasure ZeroProvider needed
            mutators,
            onClientStateNotFound: () => {
              // consumer callback wins; recreate-with-same-options is the
              // fallback, mirroring ZeroProvider's internal rotation.
              if (options.onClientStateNotFound) {
                try {
                  options.onClientStateNotFound()
                  return
                } catch {
                  // fall through to rotation
                }
              }
              if (zeroRotationPending) return
              zeroRotationPending = true
              zeroInstanceGeneration.emit(zeroInstanceGeneration.value + 1)
            },
          }),
        }
        cachedZero = cached
        zeroRotationPending = false
      }
      setInstance(cached.instance)
      // identity is fully captured by instanceKey; function props are bound
      // at construction by design.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [instanceKey])

    // a changed token on the same identity refreshes auth in place — zero
    // sends an auth update over the live connection instead of reconnecting
    // (upstream ZeroProvider does exactly this). string <-> undefined flips
    // rotate the instance via hasAuth in the identity key instead.
    const prevAuthRef = useRef(auth)
    useEffect(() => {
      const prevAuth = prevAuthRef.current
      prevAuthRef.current = auth
      if (
        instance &&
        typeof prevAuth === 'string' &&
        typeof auth === 'string' &&
        prevAuth !== auth
      ) {
        instance.connection.connect({ auth })
      }
    }, [instance, auth])

    // for now we re-parent
    if (disable) {
      return children
    }

    return (
      <AuthDataContext.Provider value={authData}>
        {instance ? (
          <ZeroProvider zero={instance}>
            <SetZeroInstance />
            <ConnectionMonitor zeroEvents={zeroEvents} />
            {children}
          </ZeroProvider>
        ) : null}
      </AuthDataContext.Provider>
    )
  }

  const SetZeroInstance = () => {
    const zeroInstance = useZero<Schema, ZeroMutators>()

    // TODO last hack zero wants us to use useZero but its a big migration
    // and has some downsides (global zero import leads to simpler code)
    // they plan to support .setAuth() at some point, and so long as we refresh
    // when we do change zero, this should be safe - that said we don't refresh
    // the browser for now, but we also don't handle new auth keys in general
    // we'll need to add that soon
    if (zeroInstance !== latestZeroInstance) {
      latestZeroInstance = zeroInstance
      // register runner for global run() helper
      setRunner((query, options) => zeroInstance.run(query as any, options))
    }

    return null
  }

  // monitors connection state and emits events (replaces onError callback removed in 0.25)
  const ConnectionMonitor = memo(
    ({
      zeroEvents,
    }: {
      zeroEvents: ReturnType<typeof createEmitter<ZeroEvent | null>>
    }) => {
      const state = useConnectionState()
      const prevState = useRef(state.name)

      useEffect(() => {
        if (state.name !== prevState.current) {
          const reason = 'reason' in state ? state.reason : ''
          prevState.current = state.name

          if (state.name === 'error' || state.name === 'needs-auth') {
            const message = typeof reason === 'string' ? reason : state.name
            zeroEvents.emit({
              type: 'error',
              message,
            })
          }
        }
      }, [state, zeroEvents])

      return null
    },
  )

  // preload data for a query into cache without materializing
  // uses same function signature as useQuery
  function preload<TArg, TTable extends keyof Schema['tables'] & string, TReturn>(
    fn: PlainQueryFn<TArg, Query<TTable, Schema, TReturn>>,
    params: TArg,
    options?: PreloadOptions,
  ): { cleanup: () => void; complete: Promise<void> }
  function preload<TTable extends keyof Schema['tables'] & string, TReturn>(
    fn: PlainQueryFn<void, Query<TTable, Schema, TReturn>>,
    options?: PreloadOptions,
  ): { cleanup: () => void; complete: Promise<void> }
  function preload(
    fnArg: any,
    paramsOrOptions?: any,
    optionsArg?: PreloadOptions,
  ): { cleanup: () => void; complete: Promise<void> } {
    const hasParams =
      optionsArg !== undefined || (paramsOrOptions && !('ttl' in paramsOrOptions))
    const params = hasParams ? paramsOrOptions : undefined
    const options = hasParams ? optionsArg : paramsOrOptions

    const queryRequest = resolveQuery({ customQueries, fn: fnArg, params })
    return zero.preload(queryRequest as any, options)
  }

  function getQuery<TArg, TTable extends keyof Schema['tables'] & string, TReturn>(
    fn: PlainQueryFn<TArg, Query<TTable, Schema, TReturn>>,
    params: TArg,
  ): ReturnType<typeof resolveQuery<Schema>>
  function getQuery<TTable extends keyof Schema['tables'] & string, TReturn>(
    fn: PlainQueryFn<void, Query<TTable, Schema, TReturn>>,
  ): ReturnType<typeof resolveQuery<Schema>>
  function getQuery(fn: any, params?: any) {
    return resolveQuery({ customQueries, fn, params })
  }

  function ControlQueries({
    children,
    action = 'disable',
    whenDisabled = 'empty',
  }: {
    children: ReactNode
    action?: 'enable' | 'disable'
    whenDisabled?: 'empty' | 'last-value'
  }) {
    const mode: QueryControlMode = action === 'enable' ? false : whenDisabled
    return <DisabledContext.Provider value={mode}>{children}</DisabledContext.Provider>
  }

  return {
    zeroEvents,
    ProvideZero,
    ControlQueries,
    useQuery,
    usePermission,
    zero,
    preload,
    getQuery,
  }
}
