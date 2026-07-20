import { createBuilder, mustGetQuery } from '@rocicorp/zero'
import { asQueryInternals } from '@rocicorp/zero/bindings'
// type-only: @rocicorp/zero/server pulls node and postgresql formatting in, and
// importing it eagerly means merely importing on-zero/server drags that into a
// browser worker. the real import happens inside transformQueryRequest, which
// only ever runs on a server.
import type { handleQueryRequest as zeroHandleQueryRequest } from '@rocicorp/zero/server'
import { createAsyncContext } from '@take-out/helpers'

import { createPermissions } from './createPermissions'
import { createMutators } from './helpers/createMutators'
import { getScopedAuthData, runWithAuthScope } from './helpers/mutatorContext'
import { runWithQueryContext } from './helpers/queryContext'
import { getMutationsPermissions } from './modelRegistry'
import { setCustomQueries } from './run'
import { getZQL, setEnvironment, setSchema } from './state'
import { setEvaluatingPermission } from './where'
import { setRunner } from './zeroRunner'

import type {
  AdminRoleMode,
  AuthData,
  GenericModels,
  MutatorContext,
  QueryBuilder,
  Transaction,
} from './types'
import type {
  AnyQueryRegistry,
  HumanReadable,
  Query,
  Schema as ZeroSchema,
  ServerTransaction as RocicorpServerTransaction,
} from '@rocicorp/zero'

export type JsonPrimitive = string | number | boolean | null
export type JsonValue =
  | JsonPrimitive
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue }

export type NormalizedClaims = {
  readonly userID: string
  readonly [claim: string]: JsonValue
}

export type TransactionQueryFormat = {
  readonly relationships: Readonly<Record<string, TransactionQueryFormat>>
  readonly singular: boolean
}

export type SqlStatementMetadata = {
  readonly table: string
  readonly publicTable: string
  readonly kind: 'delete' | 'insert' | 'update' | 'upsert'
}

export interface ZeroServerApplicationTransaction {
  exec(
    sql: string,
    params?: readonly unknown[],
    metadata?: SqlStatementMetadata,
  ): Promise<{ readonly changes: number }>
  query<Row extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: readonly unknown[],
  ): Promise<readonly Row[]>
  queryAst<Result = unknown>(
    ast: JsonValue,
    format: TransactionQueryFormat,
    queryName?: string,
  ): Promise<Result>
}

export type ZeroServerTransaction<Schema extends ZeroSchema> = RocicorpServerTransaction<
  Schema,
  ZeroServerApplicationTransaction
>

export type ZeroServerMutationContext = {
  readonly claims: NormalizedClaims
  defer(
    effect: () => void | Promise<void>,
    options?: { readonly barrier?: boolean },
  ): void
}

export type ZeroServerRegisteredMutator<Schema extends ZeroSchema = ZeroSchema> =
  (input: {
    readonly tx: ZeroServerTransaction<Schema>
    readonly args: JsonValue
    readonly ctx: ZeroServerMutationContext
  }) => void | Promise<void>

export type ZeroServerMutatorRegistry<Schema extends ZeroSchema = ZeroSchema> = Readonly<
  Record<string, ZeroServerRegisteredMutator<Schema>>
>

export interface ZeroServerExecutor<Schema extends ZeroSchema> {
  execute(name: string, args: JsonValue, claims: NormalizedClaims): Promise<void>
  transaction<Value>(
    claims: NormalizedClaims,
    work: (tx: ZeroServerTransaction<Schema>) => Value | Promise<Value>,
  ): Promise<Value>
  query<Result>(
    claims: NormalizedClaims,
    work: (tx: ZeroServerTransaction<Schema>) => Result | Promise<Result>,
  ): Promise<Result>
}

export type ValidateQueryArgs = {
  authData: AuthData | null
  queryName: string
  params: unknown
}

export type ValidateMutationArgs = {
  authData: AuthData | null
  mutatorName: string
  tableName: string
  args: unknown
}

export type ValidateQueryFn = (args: ValidateQueryArgs) => void
export type ValidateMutationFn = (args: ValidateMutationArgs) => void | Promise<void>

type MutateAuthData = Pick<AuthData, 'id'> & Partial<AuthData>

export type MutateOptions = {
  authData?: MutateAuthData
}

export type ServerMutate<Models extends GenericModels> = {
  [Key in keyof Models]: {
    [K in keyof Models[Key]['mutate']]: Models[Key]['mutate'][K] extends (
      ctx: MutatorContext,
      arg: infer Arg,
    ) => any
      ? (arg: Arg, options?: MutateOptions) => Promise<void>
      : (options?: MutateOptions) => Promise<void>
  }
}

export type CreateZeroServerBindingsOptions<
  Schema extends ZeroSchema,
  Models extends GenericModels,
  ServerActions extends Record<string, unknown>,
> = {
  schema: Schema
  models: Models
  createServerActions: () => ServerActions
  queries?: AnyQueryRegistry
  mutations?: Record<string, Record<string, unknown>>
  validateQuery?: ValidateQueryFn
  validateMutation?: ValidateMutationFn
  defaultAllowAdminRole?: AdminRoleMode
  mapClaims?: (claims: NormalizedClaims) => AuthData | null
}

export type ZeroServerBindings<
  Schema extends ZeroSchema,
  Models extends GenericModels,
> = {
  mutators: ZeroServerMutatorRegistry<Schema>
  resolveQuery(
    name: string,
    args: readonly JsonValue[],
    claims: NormalizedClaims,
  ): Promise<JsonValue>
  transformQueryRequest(options: {
    authData: AuthData | null
    request: Request
  }): ReturnType<typeof zeroHandleQueryRequest>
  server(executor: ZeroServerExecutor<Schema>): {
    mutate: ServerMutate<Models>
    transaction<Value>(
      claims: NormalizedClaims,
      work: (tx: Transaction) => Value | Promise<Value>,
    ): Promise<Value>
    query<Result>(
      claims: NormalizedClaims,
      work: (q: QueryBuilder) => Query<any, Schema, Result>,
    ): Promise<HumanReadable<Result>>
  }
}

export function createZeroServerBindings<
  Schema extends ZeroSchema,
  Models extends GenericModels,
  ServerActions extends Record<string, unknown>,
>(
  options: CreateZeroServerBindingsOptions<Schema, Models, ServerActions>,
): ZeroServerBindings<Schema, Models> {
  setSchema(options.schema, createBuilder(options.schema))
  setEnvironment('server')
  if (options.queries) setCustomQueries(options.queries)

  const mapClaims = options.mapClaims ?? defaultMapClaims
  const permissions = createPermissions({
    environment: 'server',
    schema: options.schema,
    adminRoleMode: options.defaultAllowAdminRole ?? 'all',
  })
  const registry: Record<string, ZeroServerMutatorRegistry<Schema>[string]> = {}
  const invocation = createAsyncContext<{
    authData: AuthData | null
    ctx: Parameters<ZeroServerMutatorRegistry<Schema>[string]>[0]['ctx']
  }>()
  const decoratedMutators = createMutators({
    authData: null,
    can: permissions.can,
    createServerActions: options.createServerActions,
    environment: 'server',
    models: options.models,
    mutationValidators: options.mutations,
    validateMutation: options.validateMutation
      ? async (input) => {
          try {
            await options.validateMutation!(input)
          } catch (error) {
            throw mutationApplicationError(error)
          }
        }
      : undefined,
    resolveAuthData: () => invocation.get()?.authData ?? null,
    enqueueTask(task, taskOptions) {
      const current = invocation.get()
      if (!current) throw new Error('on-zero task scheduled outside a server mutation')
      current.ctx.defer(() => runWithAuthScope(current.authData, task), taskOptions)
    },
  }) as Record<string, Record<string, (tx: Transaction, args: unknown) => Promise<void>>>

  for (const [modelName, model] of Object.entries(options.models)) {
    for (const mutatorName of Object.keys(model.mutate ?? {})) {
      registry[`${modelName}|${mutatorName}`] = async ({ tx, args, ctx }) => {
        const authData = mapClaims(ctx.claims)
        const mutation = decoratedMutators[modelName]?.[mutatorName]
        if (!mutation)
          throw new Error(`unknown on-zero mutator: ${modelName}|${mutatorName}`)
        try {
          await invocation.run({ authData, ctx }, () =>
            mutation(tx as unknown as Transaction, args),
          )
        } catch (error) {
          const name = (error as { name?: unknown })?.name
          if (name === 'MutationApplicationError') throw error
          if (name !== 'PermissionError' && name !== 'ValiError') throw error
          throw mutationApplicationError(error)
        }
      }
    }
  }

  const bindings: ZeroServerBindings<Schema, Models> = {
    // freezing the registry makes the server seam immutable without importing
    // any particular executor implementation.
    mutators: Object.freeze({ ...registry }),
    async resolveQuery(name, args, claims) {
      if (!options.queries) {
        throw new Error('No queries registered with createZeroServerBindings.')
      }
      const authData = mapClaims(claims)
      const query = await runWithQueryContext({ authData }, () =>
        resolveServerQuery({
          authData,
          name,
          args: args[0],
          queries: options.queries!,
          permissions,
          validateQuery: options.validateQuery,
        }),
      )
      return asQueryInternals(query as never).ast as JsonValue
    },
    async transformQueryRequest({ authData, request }) {
      if (!options.queries) {
        throw new Error('No queries registered with createZeroServerBindings.')
      }
      const handler = (name: string, args: unknown) =>
        resolveServerQuery({
          authData,
          name,
          args,
          queries: options.queries!,
          permissions,
          validateQuery: options.validateQuery,
        })
      const userID = typeof authData?.id === 'string' ? authData.id : undefined
      const { handleQueryRequest } = await import('@rocicorp/zero/server')
      return runWithQueryContext({ authData: authData || ({} as AuthData) }, () =>
        userID === undefined
          ? handleQueryRequest(handler as never, options.schema, request)
          : handleQueryRequest({
              handler: handler as never,
              schema: options.schema,
              request,
              userID,
            }),
      )
    },
    server(executor) {
      const transaction = <Value>(
        claims: NormalizedClaims,
        work: (tx: Transaction) => Value | Promise<Value>,
      ) => executor.transaction(claims, (tx) => work(tx as unknown as Transaction))

      setRunner((query) =>
        transaction({ userID: 'server' }, (tx) => tx.run(query as never)),
      )

      const mutate = new Proxy({} as ServerMutate<Models>, {
        get(_target, modelName: string) {
          return new Proxy(
            {},
            {
              get(_inner, mutatorName: string) {
                const handler = options.models[modelName]?.mutate?.[mutatorName]
                const acceptsArgument =
                  typeof handler === 'function' && handler.length > 1
                return (
                  argsOrOptions: JsonValue | MutateOptions,
                  optionsForArgument?: MutateOptions,
                ) => {
                  const args = acceptsArgument ? (argsOrOptions as JsonValue) : null
                  const mutateOptions = acceptsArgument
                    ? optionsForArgument
                    : (argsOrOptions as MutateOptions | undefined)
                  const scoped = mutateOptions?.authData ?? getScopedAuthData()
                  const claims = authToClaims(scoped)
                  return executor.execute(`${modelName}|${mutatorName}`, args, claims)
                }
              },
            },
          )
        },
      })

      return {
        mutate,
        transaction,
        query<Result>(
          claims: NormalizedClaims,
          work: (q: QueryBuilder) => Query<any, Schema, Result>,
        ) {
          return runWithQueryContext({ authData: mapClaims(claims) }, () =>
            executor.query(claims, (tx) => tx.run(work(getZQL()) as never)),
          ) as Promise<HumanReadable<Result>>
        },
      }
    },
  }

  return bindings
}

function resolveServerQuery({
  authData,
  name,
  args,
  queries,
  permissions,
  validateQuery,
}: {
  authData: AuthData | null
  name: string
  args: unknown
  queries: AnyQueryRegistry
  permissions: ReturnType<typeof createPermissions>
  validateQuery?: ValidateQueryFn
}) {
  if (name.startsWith('permission.')) {
    const table = name.slice('permission.'.length)
    const { objOrId } = args as { objOrId: string | Record<string, unknown> }
    const permission = getMutationsPermissions(table)
    if (!permission)
      throw new Error(`[permission] no permission defined for table: ${table}`)
    setEvaluatingPermission(true)
    try {
      return (getZQL() as any)[table]
        .where((eb: any) =>
          permissions.buildPermissionQuery(authData, eb, permission, objOrId, table),
        )
        .one()
    } finally {
      setEvaluatingPermission(false)
    }
  }

  validateQuery?.({ authData, queryName: name, params: args })
  return (mustGetQuery as any)(queries, name).fn({ args, ctx: authData })
}

// claims.userID is the sync ledger identity and is always present — logged-out
// clients still sync, as 'anon'. app auth is a separate, nullable payload:
// deriving AuthData from userID would hand every anonymous push a truthy
// authData and walk straight through `ensure(authData)` guards.
const AUTH_CLAIM = 'authData'

export function authDataToClaims(
  authData: AuthData | null | undefined,
  anonymousUserID = 'anon',
): NormalizedClaims {
  const userID = typeof authData?.id === 'string' ? authData.id : anonymousUserID
  const claims: Record<string, JsonValue> = { userID }
  if (authData) claims[AUTH_CLAIM] = authData as unknown as JsonValue
  return claims as NormalizedClaims
}

function defaultMapClaims(claims: NormalizedClaims): AuthData | null {
  const authData = (claims as unknown as Record<string, unknown>)[AUTH_CLAIM]
  if (!authData || typeof authData !== 'object') return null
  return authData as AuthData
}

function authToClaims(authData: AuthData | null | undefined): NormalizedClaims {
  return authDataToClaims(authData, 'server')
}

// compatible executors recognize an application error by shape, never by
// instanceof: name, message, and json-safe details cross package boundaries.
class MutationApplicationError extends Error {
  readonly details: JsonValue

  constructor(details: JsonValue, message?: string) {
    super(message ?? (typeof details === 'string' ? details : 'mutation rejected'))
    this.name = 'MutationApplicationError'
    this.details = details
  }
}

function mutationApplicationError(error: unknown): MutationApplicationError {
  const message = error instanceof Error ? error.message : String(error)
  return new MutationApplicationError(message, message)
}
