import { createBuilder, mustGetQuery } from '@rocicorp/zero'

import { runAsyncTaskEntries } from './asyncTasks'
import { createPermissions } from './createPermissions'
import { createMutators } from './helpers/createMutators'
import {
  getScopedAuthData,
  isInZeroMutation,
  mutatorContext,
  runWithAuthScope,
} from './helpers/mutatorContext'
import { runWithQueryContext } from './helpers/queryContext'
import { getMutationsPermissions } from './modelRegistry'
import { setCustomQueries } from './run'
import { getZQL, setEnvironment, setSchema } from './state'
import { setEvaluatingPermission } from './where'
import { setRunner } from './zeroRunner'

import type {
  AdminRoleMode,
  AsyncTask,
  AsyncTaskEntry,
  AsyncTaskOptions,
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
} from '@rocicorp/zero'
import type { Database, TransactionProviderInput } from '@rocicorp/zero/server'

type MutateAuthData = Pick<AuthData, 'email' | 'id'> & Partial<AuthData>

export type MutateOptions = {
  authData?: MutateAuthData
  awaitEffects?: boolean
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

export type ServerQueryResolverOptions = {
  authData: AuthData | null
  name: string
  args: unknown
  queries: AnyQueryRegistry
  permissions: ReturnType<typeof createPermissions>
  validateQuery?: ValidateQueryFn
}

export function resolveServerQuery({
  authData,
  name,
  args,
  queries,
  permissions,
  validateQuery,
}: ServerQueryResolverOptions) {
  if (name.startsWith('permission.')) {
    const table = name.slice('permission.'.length)
    const { objOrId } = args as {
      objOrId: string | Record<string, any>
    }
    const permission = getMutationsPermissions(table)
    if (!permission) {
      throw new Error(`[permission] no permission defined for table: ${table}`)
    }
    setEvaluatingPermission(true)
    try {
      return (getZQL() as any)[table]
        .where((eb: any) => {
          return permissions.buildPermissionQuery(
            authData,
            eb,
            permission,
            objOrId,
            table,
          )
        })
        .one()
    } finally {
      setEvaluatingPermission(false)
    }
  }

  if (validateQuery) {
    validateQuery({ authData, queryName: name, params: args })
  }

  const query = (mustGetQuery as any)(queries, name)
  return query.fn({ args, ctx: authData })
}

export type TransactionAttemptLifecycle = {
  beginAttempt(): void
  completeAttempt(): void
  rollbackAttempt(): void
  commitTransaction(): void
  rollbackTransaction(): void
}

export type ZeroServerDatabase = Database<Transaction>

export type ZeroServerCommonOptions<
  Schema extends ZeroSchema,
  Models extends GenericModels,
  ServerActions extends Record<string, unknown>,
> = {
  schema: Schema
  models: Models
  createServerActions: () => ServerActions
  queries?: AnyQueryRegistry
  /** generated validators keyed by model and mutation name */
  mutations?: Record<string, Record<string, any>>
  /** synchronous query authorization hook; throw to reject */
  validateQuery?: ValidateQueryFn
  /** mutation authorization hook; throw to reject */
  validateMutation?: ValidateMutationFn
  /** controls which operations the admin role bypasses */
  defaultAllowAdminRole?: AdminRoleMode
  /** auth data used by direct server mutations when no scope provides it */
  defaultMutateAuthData?: MutateAuthData
}

export type ZeroDirectServerOptions<
  Schema extends ZeroSchema,
  Models extends GenericModels,
  ServerActions extends Record<string, unknown>,
> = ZeroServerCommonOptions<Schema, Models, ServerActions> & {
  createDatabase: () => ZeroServerDatabase
}

export type ZeroDirectServer<Schema extends ZeroSchema, Models extends GenericModels> = {
  transaction: <
    CB extends (tx: Transaction) => Promise<any>,
    Returns extends CB extends (tx: Transaction) => Promise<infer X> ? X : never,
  >(
    query: CB,
  ) => Promise<Returns>
  mutate: ServerMutate<Models>
  query: <R>(
    cb: (q: QueryBuilder) => Query<any, Schema, R>,
    authData?: AuthData | null,
  ) => Promise<HumanReadable<R>>
}

export function createAsyncTaskCollector() {
  const committed: AsyncTaskEntry[] = []
  let attempt: AsyncTaskEntry[] | undefined
  let completedAttempt: AsyncTaskEntry[] | undefined

  const enqueueTask = (task: AsyncTask, opts?: AsyncTaskOptions) => {
    const entries = attempt ?? committed
    entries.push({ task, barrier: opts?.barrier === true })
  }

  const lifecycle: TransactionAttemptLifecycle = {
    beginAttempt() {
      attempt = []
      completedAttempt = undefined
    },
    completeAttempt() {
      completedAttempt = attempt
      attempt = undefined
    },
    rollbackAttempt() {
      attempt = undefined
      completedAttempt = undefined
    },
    commitTransaction() {
      if (completedAttempt) committed.push(...completedAttempt)
      completedAttempt = undefined
    },
    rollbackTransaction() {
      attempt = undefined
      completedAttempt = undefined
    },
  }

  return { committed, enqueueTask, lifecycle }
}

export function createZeroDirectServerRuntime<
  Schema extends ZeroSchema,
  Models extends GenericModels,
  ServerActions extends Record<string, unknown>,
>({
  createDatabase,
  createServerActions,
  defaultAllowAdminRole = 'all',
  defaultMutateAuthData = {} as MutateAuthData,
  models,
  mutations: mutationValidators,
  queries,
  schema,
  validateMutation,
  validateQuery,
}: ZeroDirectServerOptions<Schema, Models, ServerActions>): {
  permissions: ReturnType<typeof createPermissions<Schema>>
  server: ZeroDirectServer<Schema, Models>
} {
  setSchema(schema, createBuilder(schema))
  setEnvironment('server')

  const permissions = createPermissions<Schema>({
    environment: 'server',
    schema,
    adminRoleMode: defaultAllowAdminRole,
  })

  async function runTransaction<
    CB extends (tx: Transaction) => Promise<any>,
    Returns extends CB extends (tx: Transaction) => Promise<infer X> ? X : never,
  >(database: ZeroServerDatabase, query: CB): Promise<Returns> {
    try {
      if (isInZeroMutation()) {
        const { tx } = mutatorContext()
        return await query(tx)
      }
      return (await database.transaction(query, dummyTransactionInput)) as Returns
    } catch (err) {
      if ((err as any)?.name !== 'PermissionError') {
        console.error(`Error running transaction(): ${err}`)
      }
      throw err
    }
  }

  async function transaction<
    CB extends (tx: Transaction) => Promise<any>,
    Returns extends CB extends (tx: Transaction) => Promise<infer X> ? X : never,
  >(query: CB): Promise<Returns> {
    return runTransaction(createDatabase(), query)
  }

  async function runMutate(
    modelName: string,
    mutatorName: string,
    mutatorArg: unknown,
    options?: MutateOptions,
  ) {
    let authData = options?.authData
    if (!authData) {
      const scoped = getScopedAuthData()
      if (scoped) authData = scoped as MutateAuthData
    }

    const tasks = createAsyncTaskCollector()
    const mutators = createMutators({
      models,
      environment: 'server',
      enqueueTask: tasks.enqueueTask,
      authData: {
        ...defaultMutateAuthData,
        ...authData,
      },
      createServerActions,
      can: permissions.can,
      validateMutation,
      mutationValidators,
    })
    const modelMutators = mutators[modelName as keyof typeof mutators] as Record<
      string,
      (tx: Transaction, arg?: unknown) => Promise<void>
    >
    const mutator = modelMutators[mutatorName]

    await runTransaction(
      createDatabaseWithLifecycle(createDatabase(), tasks.lifecycle),
      async (tx) => {
        await mutator(tx, mutatorArg)
      },
    )

    if (tasks.committed.length) {
      const resolvedAuth = authData ?? null
      const entries = tasks.committed.map((entry) => ({
        ...entry,
        task: () => runWithAuthScope(resolvedAuth, entry.task),
      }))
      if (options?.awaitEffects) {
        await Promise.all(entries.map(({ task }) => task()))
      } else {
        await runAsyncTaskEntries(entries, { background: () => undefined })
      }
    }
  }

  const mutate = new Proxy({} as ServerMutate<Models>, {
    get(_, modelName: string) {
      return new Proxy(
        {},
        {
          get(_, mutatorName: string) {
            return (arg: unknown, options?: MutateOptions) =>
              runMutate(modelName, mutatorName, arg, options)
          },
        },
      )
    },
  })

  function query<R>(
    cb: (q: QueryBuilder) => Query<any, Schema, R>,
    authData?: AuthData | null,
  ): Promise<HumanReadable<R>> {
    const run = () =>
      transaction(async (tx) => {
        return tx.run(cb(getZQL()))
      }) as any

    if (authData !== undefined) {
      return runWithQueryContext({ authData }, run)
    }
    return run()
  }

  if (queries) {
    setCustomQueries(queries)
  }

  setRunner((queryObj) => {
    return transaction(async (tx) => {
      return tx.run(queryObj)
    })
  })

  return {
    permissions,
    server: {
      transaction,
      mutate,
      query,
    },
  }
}

export function createZeroDirectServer<
  Schema extends ZeroSchema,
  Models extends GenericModels,
  ServerActions extends Record<string, unknown>,
>(
  options: ZeroDirectServerOptions<Schema, Models, ServerActions>,
): ZeroDirectServer<Schema, Models> {
  return createZeroDirectServerRuntime(options).server
}

function createDatabaseWithLifecycle(
  database: ZeroServerDatabase,
  lifecycle: TransactionAttemptLifecycle,
): ZeroServerDatabase {
  return {
    async transaction(callback, input) {
      try {
        const value = await database.transaction(async (tx, hooks) => {
          lifecycle.beginAttempt()
          try {
            const result = await callback(tx, hooks)
            lifecycle.completeAttempt()
            return result
          } catch (error) {
            lifecycle.rollbackAttempt()
            throw error
          }
        }, input)
        lifecycle.commitTransaction()
        return value
      } catch (error) {
        lifecycle.rollbackTransaction()
        throw error
      }
    },
  }
}

const dummyTransactionInput: TransactionProviderInput = {
  clientGroupID: 'unused',
  clientID: 'unused',
  mutationID: 42,
  upstreamSchema: 'unused',
}
