import { useZero, ZeroProvider } from '@rocicorp/zero/react'
import { createEmitter, mapObject } from '@vxrn/helpers'
import { createContext, use, useMemo, type ReactNode } from 'react'

import { createPermissions } from './createPermissions'
import { createUseQuery } from './createUseQuery'
import { createMutators } from './helpers/createMutators'
import { prettyFormatZeroQuery } from './helpers/prettyFormatZeroQuery'
import { registerQuery } from './queryRegistry'
import { setAuthData, setSchema } from './state'

import type { AuthData, GenericModels, GetZeroMutators, ZeroEvent } from './types'
import type { Row, Zero, ZeroOptions, Schema as ZeroSchema } from '@rocicorp/zero'

export type GroupedQueries = Record<string, Record<string, (...args: any[]) => any>>

export function createZeroClient<
  Schema extends ZeroSchema,
  Models extends GenericModels,
  const DisableInlineQueries extends boolean = false,
>({
  schema,
  models,
  groupedQueries,
  disableInlineQueries = false as DisableInlineQueries,
}: {
  schema: Schema
  models: Models
  groupedQueries: GroupedQueries
  disableInlineQueries?: DisableInlineQueries
}) {
  type ZeroMutators = GetZeroMutators<Models>
  type ZeroInstance = Zero<Schema, ZeroMutators>
  type TableName = keyof ZeroInstance['query']

  setSchema(schema)

  // build query registry from grouped queries
  for (const [namespace, queries] of Object.entries(groupedQueries)) {
    for (const [name, fn] of Object.entries(queries)) {
      registerQuery(fn, `${namespace}.${name}`)
    }
  }

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

  const useQuery = createUseQuery<Schema, DisableInlineQueries>({
    DisabledContext,
    disableInlineQueries,
  })

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

    // note: usePermission is internal and uses inline queries intentionally
    // if disableInlineQueries is enabled, this will error and need a cast
    const [data, status] = useQuery(query as any, {
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
