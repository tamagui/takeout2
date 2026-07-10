import { defineQueries, defineQuery, Zero as ZeroClient } from '@rocicorp/zero'
import {
  useConnectionState,
  useZero,
  ZeroContext,
  ZeroProvider,
} from '@rocicorp/zero/react'
import { createEmitter, IS_SERVER_RUNTIME, type Emitter } from '@take-out/helpers'
import {
  createContext,
  memo,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Context,
  type ReactNode,
} from 'react'
import { createPermissions } from './createPermissions'
import {
  createUseQuery,
  type QueryControlMode,
  type UseQueryHook,
} from './createUseQuery'
import { createMutators } from './helpers/createMutators'
import { getAuth } from './helpers/getAuth'
import {
  composeRecoveryLogSink,
  isRecoverableZeroStalePokeMessage,
  makeZeroRecovery,
  type RecoveryGuardStorage,
  type ScheduleReloadContext,
  type ZeroRecoveryDeps,
} from './helpers/recoverZeroClient'
import { ensureHttpPullTransport } from './httpPullTransport'
import { registerClientInstance } from './instanceRegistry'
import { getAllMutationsPermissions, getMutationsPermissions } from './modelRegistry'
import { registerQuery } from './queryRegistry'
import { resolveQuery, type PlainQueryFn } from './resolveQuery'
import { setCustomQueries } from './run'
import { getEnvironment, setAuthData, setEnvironment, setSchema } from './state'
import { getRawWhere, setEvaluatingPermission } from './where'
import { setRunner, type ZeroRunner } from './zeroRunner'
import { zql } from './zql'
import type { AuthData, GenericModels, GetZeroMutators, ZeroEvent } from './types'
import type {
  AnyQueryRegistry,
  Query,
  Row,
  Zero,
  ZeroOptions,
  Schema as ZeroSchema,
} from '@rocicorp/zero'

type PreloadOptions = { ttl?: 'always' | 'never' | number | undefined }

export type GroupedQueries = Record<string, Record<string, (...args: any[]) => any>>

// controls how usePermission behaves before the server responds:
//  - 'optimistic': evaluate the permission query on the client (default)
//  - 'optimistic-deny': return false until server confirms
//  - 'optimistic-allow': return true until server confirms
export type PermissionStrategy = 'optimistic' | 'optimistic-deny' | 'optimistic-allow'

export type CreateZeroClientOptions<
  Schema extends ZeroSchema,
  Models extends GenericModels,
> = {
  schema: Schema
  models: Models
  groupedQueries: GroupedQueries
  permissionStrategy?: PermissionStrategy
  // names this client instance so multiple instances can coexist on one page.
  // each query/mutator namespace is claimed by exactly one instance, and the
  // ambient run() + the combineZeroClients facade dispatch by that claim.
  instanceName?: string
}

export type DirectQueryAdapter<Schema extends ZeroSchema> = (props: {
  DisabledContext: Context<QueryControlMode>
  customQueries: AnyQueryRegistry
  getZero: () => any
  zeroVersion: Emitter<number>
}) => UseQueryHook<Schema>

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

function createUnavailableDirectUseQuery<
  Schema extends ZeroSchema,
>(): UseQueryHook<Schema> {
  function useQueryDirect(): never {
    throw new Error(
      `[on-zero] direct queries are optional. Import createZeroClientWithDirectQueries from 'on-zero/multi' for clients used outside the innermost ZeroProvider.`,
    )
  }

  return useQueryDirect as UseQueryHook<Schema>
}

export function createZeroClient<Schema extends ZeroSchema, Models extends GenericModels>(
  options: CreateZeroClientOptions<Schema, Models>,
) {
  return createZeroClientInternal(options)
}

export function createZeroClientInternal<
  Schema extends ZeroSchema,
  Models extends GenericModels,
>({
  schema,
  models,
  groupedQueries,
  permissionStrategy = 'optimistic',
  instanceName = 'default',
  createDirectUseQuery,
}: CreateZeroClientOptions<Schema, Models> & {
  createDirectUseQuery?: DirectQueryAdapter<Schema>
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

  // claim this instance's query/mutator namespaces so the ambient run() and
  // the combineZeroClients facade dispatch to the owning instance. the
  // auto-generated 'permission' namespace stays unclaimed (per-instance).
  const instance = registerClientInstance({
    name: instanceName,
    namespaces: Object.keys(models),
    customQueries,
    queryNames: Object.entries(groupedQueries).flatMap(([namespace, queries]) =>
      Object.keys(queries).map((name) => `${namespace}.${name}`),
    ),
  })

  // register for global run() helper
  setCustomQueries(customQueries)

  const DisabledContext = createContext<QueryControlMode>(false)

  let latestZeroInstance: ZeroInstance | null = null

  // the provider creates the instance one effect-tick after mount, so on a
  // fresh page load (deep link) components render once before it exists. the
  // documented `useMutation(zero.mutate.x.y)` pattern dereferences `mutate`
  // during that render — hand back a lazy path that resolves the live instance
  // at CALL time instead of throwing at property access. a call that fires
  // with still-no instance throws the same error, so real misuse stays loud.
  function lazyMutatePath(path: string[]): any {
    const resolve = () => {
      if (latestZeroInstance === null) {
        throw new Error(
          `Zero instance not initialized. Ensure ZeroProvider is mounted before accessing 'zero'.`,
        )
      }
      let target: any = (latestZeroInstance as any).mutate
      for (const key of path) target = target[key]
      return target
    }
    return new Proxy(function lazyMutator() {} as any, {
      get(_, key) {
        if (typeof key === 'symbol') return undefined
        return lazyMutatePath([...path, key])
      },
      apply(_, __, args) {
        return resolve()(...args)
      },
    })
  }

  // Proxy allows swapping the Zero instance on login without breaking existing references.
  // Ideally rocicorp/zero would support .setAuth() natively, but for now we swap instances.
  const zero: ZeroInstance = new Proxy({} as never, {
    get(_, key) {
      if (latestZeroInstance === null) {
        if (key === 'mutate') return lazyMutatePath([])
        throw new Error(
          `Zero instance not initialized. Ensure ZeroProvider is mounted before accessing 'zero'.`,
        )
      }
      if (key === 'delete') {
        const instanceToDelete = latestZeroInstance
        return () => deleteZeroInstance(instanceToDelete)
      }
      return getZeroProxyValue(latestZeroInstance, key)
    },
  })

  // emitter names are global keys (dev hmr cache) — scope them per instance
  // so two instances never share cached values. the default name stays
  // unchanged for single-instance back-compat.
  const emitterScope = instanceName === 'default' ? '' : `:${instanceName}`

  const zeroEvents = createEmitter<ZeroEvent | null>(`zero${emitterScope}`, null)

  const zeroInstanceVersion = createDirectUseQuery
    ? createEmitter<number>(`zero-instance-version${emitterScope}`, 0)
    : null

  const AuthDataContext = createContext<AuthData>({} as AuthData)

  const useQuery = createUseQuery<Schema>({
    DisabledContext,
    customQueries,
  })

  const useQueryDirect = createDirectUseQuery
    ? createDirectUseQuery({
        DisabledContext,
        customQueries,
        getZero: () => latestZeroInstance,
        zeroVersion: zeroInstanceVersion!,
      })
    : createUnavailableDirectUseQuery<Schema>()

  // permission check uses a per-model synced query so server is authoritative
  // permissionStrategy controls client behavior before server responds.
  // built over a query hook so the facade can route permission checks down
  // the same context vs direct path as the table's other queries.
  // SSG: return an inert hook — see createUseQuery for rationale. checking
  // here (factory-time) instead of per-call keeps hook order stable so
  // rules-of-hooks stays happy.
  const createUsePermission = (useQueryImpl: UseQueryHook<Schema>) => {
    if (IS_SERVER_RUNTIME) {
      return (() => null) as (
        table: TableName | (string & {}),
        objOrId: string | Partial<Row<any>> | undefined,
        enabled?: boolean,
        debug?: boolean,
      ) => boolean | null
    }
    return function usePermission(
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

      const [data, status] = useQueryImpl(
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
  }

  const usePermission = createUsePermission(useQuery)
  const usePermissionDirect = createUsePermission(useQueryDirect)

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

  // in-place re-mint: drop the current instance's local state then reconstruct a
  // fresh client WITHOUT a page reload — the native-safe recovery path (a reload
  // may never land on prod native, wedging the module latch). the mounted
  // provider registers a bump() that changes its instanceKey; remint() drives it
  // through the same rotate effect a real identity change uses. guarded in-memory
  // (Hermes has no sessionStorage) so a client-not-found storm can't reconstruct
  // in a tight loop.
  const REMINT_GUARD_MS = 12_000
  const REMINT_MAX_ATTEMPTS = 5
  const REMINT_ATTEMPT_RESET_MS = 60_000
  const remintControl: { bump: (() => void) | null } = { bump: null }
  let lastRemintAt = 0
  let remintAttempts = 0

  function invalidateZeroInstance(instanceToInvalidate: ZeroInstance | null): void {
    if (!instanceToInvalidate) return

    if (cachedZero?.instance === instanceToInvalidate) {
      cachedZero = null
    }
    if (latestZeroInstance === instanceToInvalidate) {
      latestZeroInstance = null
      instance.runner = null
      setRunner(null)
      zeroInstanceVersion?.emit(zeroInstanceVersion.value + 1)
    }
    try {
      instanceToInvalidate.close()
    } catch {
      // a deleted client is already unusable; close is best-effort cleanup.
    }
  }

  async function deleteZeroInstance(
    instanceToDelete: ZeroInstance | null,
  ): Promise<unknown> {
    try {
      return await instanceToDelete?.delete()
    } finally {
      invalidateZeroInstance(instanceToDelete)
    }
  }

  // supported in-place recovery: reconstruct a fresh Zero client without a page
  // reload. by default drops the current instance's local store first (a
  // ClientNotFound / desync means it's unusable), then bumps the provider's
  // instanceKey so the rotate effect mints a clean client. returns false when
  // suppressed by the rate guard or when no provider is mounted.
  async function remint(opts: { dropLocalState?: boolean } = {}): Promise<boolean> {
    // no mounted provider to reconstruct through — bail BEFORE the guard so an
    // unmounted call doesn't burn an attempt or start the cooldown.
    if (!remintControl.bump) return false
    const now = Date.now()
    const sinceLast = now - lastRemintAt
    if (lastRemintAt > 0 && sinceLast < REMINT_GUARD_MS) return false
    if (sinceLast > REMINT_ATTEMPT_RESET_MS) remintAttempts = 0
    if (remintAttempts >= REMINT_MAX_ATTEMPTS) return false
    lastRemintAt = now
    remintAttempts += 1

    const { dropLocalState = true } = opts
    if (dropLocalState && latestZeroInstance) {
      await deleteZeroInstance(latestZeroInstance).catch(() => {})
    }
    // re-check: the provider may have unmounted during the async delete.
    const bump = remintControl.bump
    if (!bump) return false
    bump()
    return true
  }

  // when ProvideZero is rendered without a real Zero instance (SSG, disable=true,
  // or transiently while the active path is still creating its first instance),
  // we want descendants' useZero() / useConnectionState() / on-zero useQuery to
  // NOT throw — but also not run real queries. Hand them a stub Zero plus
  // DisabledContext='empty':
  //   1. zero/react's useZero() reads ZeroContext; the stub is truthy so it
  //      doesn't throw "useZero must be used within a ZeroProvider".
  //   2. on-zero's useQuery wrapper forces enabled=false to the underlying
  //      zero useQuery when DisabledContext is set, so zero's viewStore.getView
  //      returns its disabled-view stub without ever reading zero.clientID or
  //      subscribing through the stub.
  //   3. addContextToQuery(query, zero.context) is the only deep access in the
  //      query path; the stub's .context is a plain object so that call
  //      succeeds harmlessly.
  //   4. useConnectionState reads zero.connection.state.{subscribe,current};
  //      we provide a perma-'closed' state with a no-op subscribe. consumers
  //      handle 'closed' as a normal disconnected state.
  // This stub lets the provider tree render with stable shape regardless of
  // whether Zero is active — so children never re-parent across enable/disable.
  const DISABLED_ZERO_STUB_CONNECTION_STATE = {
    current: { name: 'closed' as const },
    subscribe: () => () => {},
  }
  const DISABLED_ZERO_STUB = {
    context: {},
    connection: { state: DISABLED_ZERO_STUB_CONNECTION_STATE },
  } as unknown as ZeroInstance

  type ProvideZeroProps = Omit<
    ZeroOptions<Schema, ZeroMutators>,
    'schema' | 'mutators'
  > & {
    children: ReactNode
    authData?: AuthData | null
    // when true, ProvideZero renders a stable shell with stub Zero — no real
    // client is created, no websocket is opened, no IDB store is touched.
    // useQuery descendants receive EMPTY_RESPONSE via DisabledContext='empty'.
    // toggling this on/off NEVER re-parents children: the React tree shape is
    // identical in both modes (active just mounts a sibling lifecycle, which
    // doesn't shift children's position). use this when consumers need the
    // provider tree mounted (e.g. inside a marketing splash that lazily
    // upgrades to the real IDE) without paying for Zero until activation.
    disable?: boolean
    // 'http-pull' runs the stock zero client over stateless HTTP pull/push
    // (no websocket, no resident server state) by intercepting the sync
    // socket for this instance's server origin. see httpPullTransport.ts.
    transport?: 'http-pull'
    // http-pull only: every open connection also pulls on this interval so
    // server-initiated changes arrive without a client-side trigger
    pullIntervalMs?: number
    // awaited before a self-healing recovery reload — e.g. wait for the dev
    // origin to be reachable so the reload doesn't hit a restarting server.
    beforeReload?: () => Promise<void>
    // take over WHEN/HOW the recovery reload happens (IDE gate + countdown,
    // native expo-updates reload, …) while still driving the same
    // deletes-then-reload work via ctx.performReload. default: immediate reload.
    scheduleReload?: (ctx: ScheduleReloadContext) => void
    // cross-reload loop-guard backing store; defaults to sessionStorage on web.
    // inject a native KV so Hermes gets real cross-reload protection.
    guardStorage?: RecoveryGuardStorage
    // return true for a classified recovery log the app wants treated as benign
    // (its own cold-boot timeout, say) so it does NOT trigger recovery.
    benignLogFilter?: (message: string) => boolean
    // called when the connection needs auth; return a fresh token to reconnect
    // in place. lets an expired token auto-recover without a reload.
    refreshAuth?: () => Promise<string | undefined>
    // when true, mirror this instance's connection state onto
    // document.body.dataset.zero* for e2e/diagnostics. enable on ONE instance
    // (the control/primary) so multiple instances don't fight over the dataset.
    connectionDataset?: boolean
  }

  // providezero keeps the same provider/fiber layout on ssr and client so
  // useId() stays stable across hydration. the server implementation has no
  // hooks because the ssg runtime can load on-zero through a non-deduped react
  // copy whose dispatcher is null; the client implementation always calls its
  // hooks, regardless of `disable`.
  const ProvideZeroServer = ({ children, authData: authDataIn }: ProvideZeroProps) => {
    return (
      <AuthDataContext.Provider value={(authDataIn ?? {}) as AuthData}>
        <DisabledContext.Provider value="empty">
          <ZeroContext.Provider value={DISABLED_ZERO_STUB as any}>
            {/* match the active path's 3-child layout exactly so descendant
                useId() lands at the same fiber index in both branches. the
                two leading nulls reserve the SetZeroInstance + ConnectionMonitor
                slots; the active path puts those components there only once
                an instance exists. without these placeholder slots, children
                would sit at child index 0 here but index 2 in the active
                path, shifting every descendant useId. */}
            {null}
            {null}
            {children}
          </ZeroContext.Provider>
        </DisabledContext.Provider>
      </AuthDataContext.Provider>
    )
  }

  const ProvideZeroClient = ({
    children,
    authData: authDataIn,
    transport,
    pullIntervalMs = 30_000,
    beforeReload,
    scheduleReload,
    guardStorage,
    benignLogFilter,
    refreshAuth,
    connectionDataset,
    disable,
    ...props
  }: ProvideZeroProps) => {
    // resolve the auth token first: a real logout (token gone) must clear
    // authData so client mutators don't keep running as the old user, while a
    // transient authData blip with the token still present (session refresh, tab
    // wake) keeps the last value so mutations never see null mid-transition.
    const auth = 'auth' in props ? (props as { auth?: string | null }).auth : undefined
    const hasAuth = typeof auth === 'string'

    // stabilize authData across transient gaps, but ONLY while authed — bakes in
    // what consumers hand-rolled with a ref, and additionally clears on logout
    // (the bare ref pattern does not, leaving mutators running as the old user
    // until the instance rotates).
    const stableAuthDataRef = useRef<AuthData | null>(authDataIn ?? null)
    if (authDataIn) {
      stableAuthDataRef.current = authDataIn
    } else if (!hasAuth) {
      stableAuthDataRef.current = null
    }
    const authData = (authDataIn ?? stableAuthDataRef.current ?? null) as AuthData

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

    // remint() reconstructs the client in place by bumping this counter, which
    // changes instanceKey and drives the rotate effect exactly as a real
    // identity change does. register the bump so the imperative remint() API can
    // reach this mounted provider.
    const [remintGeneration, setRemintGeneration] = useState(0)
    useEffect(() => {
      remintControl.bump = () => setRemintGeneration((generation) => generation + 1)
      return () => {
        remintControl.bump = null
      }
    }, [])

    // identity = every primitive option except the auth token value (token
    // changes refresh in place below; logged-in <-> logged-out still rotates
    // via hasAuth, matching zero's documented provider semantics). function
    // props (callbacks, logSink, batchViewUpdates) are bound at construction.
    // remintGeneration is included so remint() forces a fresh instance.
    const instanceKey = JSON.stringify([
      Object.entries({ kvStore: 'mem', ...props })
        .filter(
          ([key, value]) =>
            key !== 'auth' && typeof value !== 'function' && value !== undefined,
        )
        .sort(([a], [b]) => (a < b ? -1 : 1)),
      hasAuth,
      transport,
      remintGeneration,
    ])

    // create/rotate in an effect — commit-safe: a discarded concurrent render
    // can never close an instance the committed tree still uses. a suspense
    // hide/reveal re-runs this effect with an unchanged key — cache hit, no
    // churn, no cleanup-close. children mounting one effect-tick after the
    // provider matches ZeroProvider's internal-creation timing, which consumer
    // boot orchestration observes.
    const [instance, setInstance] = useState<ZeroInstance | undefined>()
    useEffect(() => {
      // disable=true: do not create / rotate any instance. consumers can
      // toggle disable on/off mid-mount without violating rules-of-hooks
      // because every hook still runs every render — only the effect body
      // (and the returned JSX, below) varies with disable.
      if (disable) {
        if (instance !== undefined) setInstance(undefined)
        return
      }
      let cached = cachedZero
      if (cached?.key !== instanceKey) {
        cached?.instance.close()
        const options = props as Omit<
          ZeroOptions<Schema, ZeroMutators>,
          'schema' | 'mutators'
        >
        // install before construction so the instance's first connect goes
        // through HTTP. per-origin idempotent — rotation reuses the install.
        if (transport === 'http-pull') {
          // same precedence as zero's own getServer (cacheURL is the current
          // option name; server is its deprecated alias)
          const serverURL = options.cacheURL ?? options.server
          if (typeof serverURL !== 'string') {
            throw new Error(`transport 'http-pull' requires a server URL`)
          }
          ensureHttpPullTransport({ origin: serverURL, pullIntervalMs })
        }
        // recovery closures reach the instance through this ref so they always
        // delete the CURRENT instance's own store (set right after construction;
        // the handlers only fire post-mount).
        const instanceRef: { current: ZeroInstance | null } = { current: null }
        const recoveryDeps: ZeroRecoveryDeps = {
          deleteLocalState: () => deleteZeroInstance(instanceRef.current),
          zeroEvents,
          beforeReload,
          scheduleReload,
          guardStorage,
          benignLogFilter,
        }
        const recovery = makeZeroRecovery(recoveryDeps)
        const createdInstance = new ZeroClient<Schema, ZeroMutators>({
          kvStore: 'mem',
          ...options,
          schema,
          // @ts-expect-error same erasure ZeroProvider needed
          mutators,
          // when the consumer brings no logSink, install ours: it preserves
          // Zero's console output AND watches for the local-store-lost signature.
          // a consumer with its own logSink owns log-based recovery (no
          // double-fire with e.g. soot's origin-gated recovery).
          logSink: options.logSink ?? composeRecoveryLogSink(recoveryDeps),
          // consumer handlers win; otherwise on-zero's default self-healing
          // recovery covers EVERY reason (drop local state + reload, guarded) —
          // passing these to Zero disables its built-in reload, so any reason we
          // left unhandled would fatal-blank the app forever.
          onUpdateNeeded: options.onUpdateNeeded ?? recovery.onUpdateNeeded,
          onClientStateNotFound:
            options.onClientStateNotFound ?? recovery.onClientStateNotFound,
        })
        instanceRef.current = createdInstance
        cached = { key: instanceKey, instance: createdInstance }
        cachedZero = cached
      }
      setInstance(cached.instance)
      // identity is fully captured by instanceKey; function props are bound
      // at construction by design. `disable` is a dep so a true → false
      // transition runs the effect and mints the instance.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [instanceKey, disable])

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

    // Always render the same shell shape, with or without an instance, and
    // whether disable is true or false. While the instance is being
    // constructed (first effect tick) — OR while disable=true — we hand
    // descendants the stub Zero plus DisabledContext='empty' so
    // useZero/useQuery short-circuit instead of throwing. SetZeroInstance +
    // ConnectionMonitor only mount once an active instance exists, as
    // siblings of children — they NEVER wrap children, so toggling them
    // never re-parents.
    const liveInstance = disable ? undefined : instance
    return (
      <AuthDataContext.Provider value={authData}>
        <DisabledContext.Provider value={liveInstance ? false : 'empty'}>
          <ZeroContext.Provider value={liveInstance ?? (DISABLED_ZERO_STUB as any)}>
            {liveInstance ? <SetZeroInstance /> : null}
            {liveInstance ? (
              <ConnectionMonitor
                zeroEvents={zeroEvents}
                refreshAuth={refreshAuth}
                exposeDataset={connectionDataset}
                datasetCacheUrl={
                  connectionDataset
                    ? ((props as { cacheURL?: string; server?: string }).cacheURL ??
                      (props as { cacheURL?: string; server?: string }).server)
                    : undefined
                }
              />
            ) : null}
            {children}
          </ZeroContext.Provider>
        </DisabledContext.Provider>
      </AuthDataContext.Provider>
    )
  }

  const ProvideZero = IS_SERVER_RUNTIME ? ProvideZeroServer : ProvideZeroClient

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
      const runner: ZeroRunner = (query, options) =>
        zeroInstance.run(query as any, options)
      // the instance-keyed runner is what run() dispatches owned namespaces
      // to; the global runner stays as the ambient fallback (inline zql)
      instance.runner = runner
      setRunner(runner)
    }

    useEffect(() => {
      zeroInstanceVersion?.emit(zeroInstanceVersion.value + 1)
    }, [zeroInstance])

    return null
  }

  // monitors connection state and emits events (replaces onError callback removed
  // in 0.25). also owns the generic-Zero connection recovery that used to live in
  // each consumer: stale-poke reconnect, needs-auth token refresh, and optional
  // e2e dataset bookkeeping.
  const ConnectionMonitor = memo(
    ({
      zeroEvents,
      refreshAuth,
      exposeDataset,
      datasetCacheUrl,
    }: {
      zeroEvents: ReturnType<typeof createEmitter<ZeroEvent | null>>
      refreshAuth?: () => Promise<string | undefined>
      exposeDataset?: boolean
      datasetCacheUrl?: string
    }) => {
      const zeroInstance = useZero<Schema, ZeroMutators>()
      const state = useConnectionState()
      const prevState = useRef(state.name)
      // one reconnect per distinct stale-poke reason / one refresh per needs-auth
      // transition, so a stuck error state doesn't retry-storm.
      const staleReconnectRef = useRef<string | null>(null)
      const needsAuthRef = useRef(false)

      useEffect(() => {
        const name = state.name
        const reason =
          'reason' in state && typeof state.reason === 'string' ? state.reason : ''

        // mirror connection state onto the body dataset for e2e/diagnostics
        // (enabled on one instance so instances don't clobber each other).
        if (exposeDataset && typeof document !== 'undefined' && document.body) {
          document.body.dataset.zeroState = name
          if (datasetCacheUrl) document.body.dataset.zeroCacheUrl = datasetCacheUrl
          if (reason) document.body.dataset.zeroReason = reason.slice(0, 200)
          else delete document.body.dataset.zeroReason
          if (name === 'connected') document.body.dataset.zeroConnected = 'true'
          else delete document.body.dataset.zeroConnected
        }

        // stale-poke / stale-cookie: the local view is behind the server
        // snapshot; a plain reconnect resolves it. not fatal — don't emit error.
        if (name === 'error' && isRecoverableZeroStalePokeMessage(reason)) {
          if (staleReconnectRef.current !== reason) {
            staleReconnectRef.current = reason
            void Promise.resolve(zeroInstance.connection?.connect?.()).catch(() => {})
          }
          return
        }
        if (name !== 'error') staleReconnectRef.current = null

        // needs-auth: the token expired and zero won't auto-resume unless the
        // auth string changes. refresh it and reconnect in place, once.
        if (name === 'needs-auth') {
          if (refreshAuth && !needsAuthRef.current) {
            needsAuthRef.current = true
            void refreshAuth()
              .then((token) => {
                if (token) zeroInstance.connection?.connect?.({ auth: token })
              })
              .catch(() => {})
          }
        } else {
          needsAuthRef.current = false
        }

        if (name !== prevState.current) {
          prevState.current = name
          if (name === 'error' || name === 'needs-auth') {
            zeroEvents.emit({ type: 'error', message: reason || name })
          }
        }
      }, [state, zeroEvents, zeroInstance, refreshAuth, exposeDataset, datasetCacheUrl])

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
    instanceName,
    zeroEvents,
    ProvideZero,
    ControlQueries,
    useQuery,
    useQueryDirect,
    usePermission,
    usePermissionDirect,
    zero,
    preload,
    getQuery,
    remint,
  }
}
