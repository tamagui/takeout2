import { defineQueries, defineQuery } from '@rocicorp/zero'
import { useConnectionState, useZero, ZeroProvider } from '@rocicorp/zero/react'
import { createEmitter } from '@take-out/helpers'
import {
  createContext,
  memo,
  use,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'

import { createPermissions } from './createPermissions'
import { createUseQuery } from './createUseQuery'
import { createMutators } from './helpers/createMutators'
import { getQueryOrMutatorAuthData } from './helpers/getQueryOrMutatorAuthData'
import { getAllMutationsPermissions, getMutationsPermissions } from './modelRegistry'
import { registerQuery } from './queryRegistry'
import { resolveQuery, type PlainQueryFn } from './resolveQuery'
import { setCustomQueries } from './run'
import { setAuthData, setSchema } from './state'
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
  type TableName = keyof ZeroInstance['query'] extends string
    ? keyof ZeroInstance['query']
    : never

  setSchema(schema)

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
        fn(args)
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
                getQueryOrMutatorAuthData(),
                eb,
                rawPerm || ((e: any) => e.and()),
                args.objOrId,
                table
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
            getQueryOrMutatorAuthData(),
            eb,
            perm || ((e: any) => e.and()),
            args.objOrId,
            table
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

  const DisabledContext = createContext(false)

  let latestZeroInstance: ZeroInstance | null = null

  // Proxy allows swapping the Zero instance on login without breaking existing references.
  // Ideally rocicorp/zero would support .setAuth() natively, but for now we swap instances.
  const zero: ZeroInstance = new Proxy({} as never, {
    get(_, key) {
      if (latestZeroInstance === null) {
        throw new Error(
          `Zero instance not initialized. Ensure ZeroProvider is mounted before accessing 'zero'.`
        )
      }
      return Reflect.get(latestZeroInstance, key, latestZeroInstance)
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
    debug = false
  ): boolean | null {
    const disabled = use(DisabledContext)
    const tableStr = table as string
    const checkFn = permissionCheckFns[tableStr]

    const [data, status] = useQuery(
      checkFn as any,
      { objOrId: objOrId as any },
      { enabled: Boolean(!disabled && enabled && objOrId && checkFn) }
    )

    if (debug) {
      console.info(`usePermission()`, { table, objOrId, data, status })
    }

    if (!objOrId) return false

    // null while loading, then server's authoritative answer
    if (status.type === 'unknown') return null

    return Boolean(data)
  }

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

    // recreate mutators when auth changes so ZeroProvider recreates the Zero instance
    // (mutators read auth dynamically via getAuthData(), but Zero needs fresh instance on auth change)
    const mutators = useMemo(() => {
      return createMutators({
        models,
        environment: 'client',
        authData,
        can: permissionsHelpers.can,
      })
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authData])

    // for now we re-parent
    if (disable) {
      return children
    }

    return (
      <AuthDataContext.Provider value={authData}>
        <ZeroProvider
          schema={schema}
          kvStore="mem"
          // @ts-expect-error
          mutators={mutators}
          {...props}
        >
          <SetZeroInstance />
          <ConnectionMonitor zeroEvents={zeroEvents} />
          {children}
        </ZeroProvider>
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
    }
  )

  // preload data for a query into cache without materializing
  // uses same function signature as useQuery
  function preload<TArg, TTable extends keyof Schema['tables'] & string, TReturn>(
    fn: PlainQueryFn<TArg, Query<TTable, Schema, TReturn>>,
    params: TArg,
    options?: PreloadOptions
  ): { cleanup: () => void; complete: Promise<void> }
  function preload<TTable extends keyof Schema['tables'] & string, TReturn>(
    fn: PlainQueryFn<void, Query<TTable, Schema, TReturn>>,
    options?: PreloadOptions
  ): { cleanup: () => void; complete: Promise<void> }
  function preload(
    fnArg: any,
    paramsOrOptions?: any,
    optionsArg?: PreloadOptions
  ): { cleanup: () => void; complete: Promise<void> } {
    const hasParams =
      optionsArg !== undefined || (paramsOrOptions && !('ttl' in paramsOrOptions))
    const params = hasParams ? paramsOrOptions : undefined
    const options = hasParams ? optionsArg : paramsOrOptions

    const queryRequest = resolveQuery({ customQueries, fn: fnArg, params })
    return zero.preload(queryRequest as any, options)
  }

  return {
    zeroEvents,
    ProvideZero,
    useQuery,
    usePermission,
    zero,
    preload,
  }
}
