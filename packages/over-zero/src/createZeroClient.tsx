import type {
  HumanReadable,
  Query,
  ReadonlyJSONValue,
  Row,
  SyncedQuery,
  Zero,
  ZeroOptions,
  Schema as ZeroSchema,
} from '@rocicorp/zero'
import { syncedQuery } from '@rocicorp/zero'
import { useZero, ZeroProvider, useQuery as zeroUseQuery } from '@rocicorp/zero/react'
import { createEmitter, mapObject } from '@vxrn/helpers'
import { createContext, use, useMemo, type ReactNode } from 'react'
import { createPermissions } from './createPermissions'
import { createMutators } from './helpers/createMutators'
import { prettyFormatZeroQuery } from './helpers/prettyFormatZeroQuery'
import { useZeroDebug } from './helpers/useZeroDebug'
import { setAuthData, setSchema } from './state'
import type { AuthData, GenericModels, GetZeroMutators, ZeroEvent } from './types'

export function createZeroClient<
  Schema extends ZeroSchema,
  Models extends GenericModels,
>({ schema, models }: { schema: Schema; models: Models }) {
  type ZeroMutators = GetZeroMutators<Models>
  type ZeroInstance = Zero<Schema, ZeroMutators>
  type TableName = keyof ZeroInstance['query']

  setSchema(schema)

  const DisabledContext = createContext(false)

  const modelWritePermissions = mapObject(models, (val) => val.permissions) as {
    [K in TableName]: K extends keyof Models ? Models[K]['permissions'] : never
  }

  let latestZeroInstance: ZeroInstance | null = null

  // when we log in this is swapped out and later the exported zero is just a proxy
  // may cause some issues, ideally zero itself supports this
  const zero: ZeroInstance = new Proxy({} as never, {
    get(_, key) {
      return Reflect.get(latestZeroInstance!, key, latestZeroInstance)
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

  // we don't want flickers as you move around and these queries are re-run
  // and things generally aren't changing with permissions rapidly, so lets
  // cache the last results and use that when first rendering, they will
  // always update once the query resolves
  function usePermission<K extends TableName>(
    table: K,
    objOrId: string | Partial<Row<Schema['tables'][K]>> | undefined,
    enabled = typeof objOrId !== 'undefined',
    debug = false
  ): boolean | null {
    const disabled = use(DisabledContext)
    // const cacheVal = permissionCache.get(key) ?? permissionCache.get(keyBase)
    const authData = useAuthData()
    const permission = modelWritePermissions[table]

    const query = (() => {
      let baseQuery = zero.query[table].one()

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

    const [data, status] = useQuery(query, {
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

  type PlainQueryFn<
    TArg = any,
    TReturn extends Query<any, any, any> = Query<any, any, any>,
  > = (args: TArg) => TReturn

  type UseQueryOptions = {
    enabled?: boolean | undefined
    ttl?: 'always' | 'never' | number | undefined
  }

  type QueryResultDetails = ReturnType<typeof zeroUseQuery>[1]
  type QueryResult<TReturn> = readonly [HumanReadable<TReturn>, QueryResultDetails]

  const queryCache = new Map<string, SyncedQuery<any, any, any, any, any>>()

  const parseAny = (x: unknown[]): [ReadonlyJSONValue] => [x[0] as ReadonlyJSONValue]

  // Overload 1: Original API - Query or SyncedQuery with options
  function useQuery<TTable extends keyof Schema['tables'] & string, TReturn>(
    query:
      | Query<Schema, TTable, TReturn>
      | SyncedQuery<any, any, any, any, Query<Schema, TTable, TReturn>>,
    options?: UseQueryOptions | boolean
  ): QueryResult<TReturn>

  // Overload 2: Plain function with params
  function useQuery<TArg, TTable extends keyof Schema['tables'] & string, TReturn>(
    fn: PlainQueryFn<TArg, Query<Schema, TTable, TReturn>>,
    params: TArg,
    options?: UseQueryOptions | boolean
  ): QueryResult<TReturn>

  // Overload 3: Plain function with no params
  function useQuery<TTable extends keyof Schema['tables'] & string, TReturn>(
    fn: PlainQueryFn<void, Query<Schema, TTable, TReturn>>,
    options?: UseQueryOptions | boolean
  ): QueryResult<TReturn>

  // Implementation - keep it simple with any
  function useQuery(...args: any[]): any {
    const disabled = use(DisabledContext)
    const [queryOrFn, paramsOrOptions, optionsArg] = args

    // Detect which calling pattern is being used
    const isPlainFunction = typeof queryOrFn === 'function' && !('queryName' in queryOrFn)

    const { actualQuery, options } = useMemo(() => {
      if (!isPlainFunction) {
        // Pattern 1: Original API - useQuery(query, options)
        return {
          actualQuery: queryOrFn,
          options: paramsOrOptions,
        }
      }

      const fn = queryOrFn
      const queryName = fn.name || 'anonymousQuery'

      // Determine if this is Pattern 2 (with params) or Pattern 3 (no params)
      const hasParams =
        optionsArg !== undefined ||
        (paramsOrOptions &&
          typeof paramsOrOptions === 'object' &&
          !('enabled' in paramsOrOptions) &&
          !('ttl' in paramsOrOptions))

      const params = hasParams ? paramsOrOptions : undefined
      const opts = hasParams ? optionsArg : paramsOrOptions

      let synced = queryCache.get(queryName)
      if (!synced) {
        synced = syncedQuery(queryName, parseAny, (arg: ReadonlyJSONValue) => {
          return fn(arg)
        })
        queryCache.set(queryName, synced)
      }

      // Call the SyncedQuery with params if provided
      const query = params !== undefined ? (synced as any)(params) : synced

      return { actualQuery: query, options: opts }
    }, [queryOrFn, paramsOrOptions, optionsArg, isPlainFunction])

    const out = zeroUseQuery(actualQuery, options)

    if (process.env.NODE_ENV === 'development') {
      // biome-ignore lint/correctness/useHookAtTopLevel: ok
      useZeroDebug(actualQuery, options, out)
    }

    if (disabled) {
      return [null, { type: 'unknown' }] as never
    }

    return out
  }

  const ProvideZero = ({
    children,
    authData: authDataIn,
    disable,
    ...props
  }: Omit<ZeroOptions<Schema, ZeroMutators>, 'schema' | 'mutators'> & {
    children: ReactNode
    authData?: AuthData
    disable?: boolean
  }) => {
    const authData = authDataIn as AuthData

    const mutators = useMemo(() => {
      setAuthData(authData)

      return createMutators({
        models,
        environment: 'client',
        authData,
        can: permissionsHelpers.can,
      })
    }, [models, authData])

    // for now we re-parent
    if (disable) {
      return children
    }

    return (
      <AuthDataContext.Provider value={authData}>
        <ZeroProvider
          schema={schema}
          kvStore="mem"
          onError={(error) => {
            console.error(`Zero Error:`, error)
            zeroEvents.emit({
              type: 'error',
              message: error,
            })
          }}
          mutators={mutators}
          {...props}
        >
          <SetZeroInstance />
          {children}
        </ZeroProvider>
      </AuthDataContext.Provider>
    )
  }

  const SetZeroInstance = () => {
    const zero = useZero<Schema, ZeroMutators>()

    // TODO last hack zero wants us to use useZero but its a big migration
    // and has some downsides (global zero import leads to simpler code)
    // they plan to support .setAuth() at some point, and so long as we refresh
    // when we do change zero, this should be safe - that said we don't refresh
    // the browser for now, but we also don't handle new auth keys in general
    // we'll need to add that soon
    if (zero !== latestZeroInstance) {
      latestZeroInstance = zero
    }

    return null
  }

  return {
    zeroEvents,
    ProvideZero,
    useQuery,
    usePermission,
    zero,
  }
}
