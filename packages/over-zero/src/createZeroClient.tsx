import { defineQueries, defineQuery } from '@rocicorp/zero'
import {
  useConnectionState,
  useZero,
  ZeroProvider,
  useQuery as zeroUseQuery,
} from '@rocicorp/zero/react'
import { createEmitter, mapObject } from '@take-out/helpers'
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
import { prettyFormatZeroQuery } from './helpers/prettyFormatZeroQuery'
import { registerQuery } from './queryRegistry'
import { resolveQuery, type PlainQueryFn } from './resolveQuery'
import { setCustomQueries } from './run'
import { setAuthData, setSchema } from './state'
import { setRunner } from './zeroRunner'

import type { AuthData, GenericModels, GetZeroMutators, Where, ZeroEvent } from './types'
import type {
  HumanReadable,
  Query,
  Row,
  Schema as ZeroSchema,
  Zero,
  ZeroOptions,
} from '@rocicorp/zero'

type PreloadOptions = { ttl?: 'always' | 'never' | number | undefined }

export type GroupedQueries = Record<string, Record<string, (...args: any[]) => any>>

export function createZeroClient<
  Schema extends ZeroSchema,
  Models extends GenericModels,
>({
  schema,
  models,
  groupedQueries,
}: {
  schema: Schema
  models: Models
  groupedQueries: GroupedQueries
}) {
  type ZeroMutators = GetZeroMutators<Models>
  type ZeroInstance = Zero<Schema, ZeroMutators>
  type TableName = keyof ZeroInstance['query']

  setSchema(schema)

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

  // create the single shared CustomQuery registry
  const customQueries = defineQueries(wrappedNamespaces)

  // register for global run() helper
  setCustomQueries(customQueries)

  const DisabledContext = createContext(false)

  const modelWritePermissions = mapObject(models, (val) => val.permissions) as Record<
    TableName,
    Where<any, any> | undefined
  >

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

  const permissionsHelpers = createPermissions<Schema>({
    schema,
    environment: 'client',
  })

  // const permissionCache = createLocalStorage<string, boolean>('permissions-cache', {
  //   storageLimit: 24,
  // })

  const zeroEvents = createEmitter<ZeroEvent | null>('zero', null)

  const AuthDataContext = createContext<AuthData>({} as AuthData)
  const useAuthData = () => use(AuthDataContext)

  const useQuery = createUseQuery<Schema>({
    DisabledContext,
    customQueries,
  })

  // we don't want flickers as you move around and these queries are re-run
  // and things generally aren't changing with permissions rapidly, so lets
  // cache the last results and use that when first rendering, they will
  // always update once the query resolves
  function usePermission<K extends TableName>(
    table: K,
    objOrId: string | Partial<Row<any>> | undefined,
    enabled = typeof objOrId !== 'undefined',
    debug = false
  ): boolean | null {
    const disabled = use(DisabledContext)
    // const cacheVal = permissionCache.get(key) ?? permissionCache.get(keyBase)
    const authData = useAuthData()
    const permission = modelWritePermissions[table]

    const query = (() => {
      let baseQuery = (zero.query as any)[table].one()

      if (disabled || !enabled || !permission) {
        return baseQuery
      }

      return baseQuery.where((eb) => {
        return permissionsHelpers.buildPermissionQuery(
          authData,
          eb,
          permission,
          objOrId as any
        )
      })
    })()

    // usePermission is internal and uses inline queries directly via zeroUseQuery
    const [data, status] = zeroUseQuery(query, {
      enabled: Boolean(enabled && permission && authData && objOrId),
    })

    if (debug) {
      console.info(
        `usePermission()`,
        { data, status, authData, permission },
        prettyFormatZeroQuery(query)
      )
    }

    const result = data

    const allowed = Boolean(result)

    if (!objOrId) {
      return false
    }

    return allowed
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

    const mutators = useMemo(() => {
      setAuthData(authData)

      return createMutators({
        models,
        environment: 'client',
        authData,
        can: permissionsHelpers.can,
      })
    }, [authData])

    // for now we re-parent
    if (disable) {
      return children
    }

    return (
      <AuthDataContext.Provider value={authData}>
        <ZeroProvider schema={schema} kvStore="mem" mutators={mutators as any} {...props}>
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
