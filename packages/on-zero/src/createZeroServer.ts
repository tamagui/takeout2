import { mustGetQuery } from '@rocicorp/zero'
import { PushProcessor } from '@rocicorp/zero/pg'
import { handleQueryRequest as zeroHandleQueryRequest } from '@rocicorp/zero/server'
import { zeroNodePg } from '@rocicorp/zero/server/adapters/pg'
import { assertString } from '@take-out/helpers'
import { Pool } from 'pg'

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
  AsyncAction,
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
import type { TransactionProviderInput } from '@rocicorp/zero/pg'

type MutateAuthData = Pick<AuthData, 'email' | 'id'> & Partial<AuthData>

type MutateOptions = {
  authData?: MutateAuthData
  awaitEffects?: boolean
}

type ServerMutate<Models extends GenericModels> = {
  [Key in keyof Models]: {
    [K in keyof Models[Key]['mutate']]: Models[Key]['mutate'][K] extends (
      ctx: MutatorContext,
      arg: infer Arg
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

export function createZeroServer<
  Schema extends ZeroSchema,
  Models extends GenericModels,
  ServerActions extends Record<string, unknown>,
>({
  createServerActions,
  database,
  schema,
  models,
  queries,
  mutations: mutationValidators,
  validateQuery,
  validateMutation,
  defaultAllowAdminRole = 'all',
  defaultMutateAuthData = {} as MutateAuthData,
}: {
  /**
   * The DB connection string, same as ZERO_UPSTREAM_DB
   */
  database: string
  schema: Schema
  models: Models
  createServerActions: () => ServerActions
  queries?: AnyQueryRegistry
  /**
   * Generated valibot validators for mutation args, keyed by model.mutationName.
   * Pass the `mutationValidators` export from generated syncedMutations.ts.
   * Args are auto-validated before running the mutation.
   */
  mutations?: Record<string, Record<string, any>>
  /**
   * Hook to validate queries before execution. Throw to reject.
   * Must be synchronous.
   */
  validateQuery?: ValidateQueryFn
  /**
   * Hook to validate mutations before execution. Throw to reject.
   */
  validateMutation?: ValidateMutationFn
  /**
   * Admin role bypass for permissions:
   * - 'all': admin bypasses both query and mutation permissions (default)
   * - 'queries': admin bypasses only query permissions
   * - 'mutations': admin bypasses only mutation permissions
   * - 'off': admin has no special bypass
   */
  defaultAllowAdminRole?: AdminRoleMode
  /**
   * Default authData used by zeroServer.mutate when no authData is provided
   * and none is available from mutation context or auth scope.
   * Defaults to {}.
   */
  defaultMutateAuthData?: MutateAuthData
}) {
  setSchema(schema)
  setEnvironment('server')

  const dbString = assertString(database, `createZeroServer "database"`)

  const pool = new Pool({
    connectionString: dbString,
    // handle self-signed certificates in production
    ssl: dbString.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
  })

  // prevent unhandled 'error' events from crashing the process
  // when postgres kills idle-in-transaction connections
  pool.on('error', (error) => {
    console.error(`[on-zero] pool error`, error.message)
  })
  pool.on('connect', (client) => {
    client.on('error', (error) => {
      console.error(`[on-zero] client error`, error.message)
    })
  })

  const zeroDb = zeroNodePg(schema, pool)

  const permissions = createPermissions<Schema>({
    environment: 'server',
    schema,
    adminRoleMode: defaultAllowAdminRole,
  })

  const processor = new PushProcessor(zeroDb)

  const handleMutationRequest = async ({
    authData,
    request,
    skipAsyncTasks,
  }: {
    authData: AuthData | null
    request: Request
    skipAsyncTasks?: boolean
  }) => {
    // since mutations do DB work in transaction, avoid any async tasks during
    const asyncTasks: AsyncAction[] = []

    const mutators = createMutators({
      asyncTasks,
      can: permissions.can,
      createServerActions,
      environment: 'server',
      models,
      authData,
      validateMutation,
      mutationValidators,
    })

    // @ts-expect-error type is ok but config in monorepo
    const response = await processor.process(mutators, request)

    // now finish
    if (!skipAsyncTasks && asyncTasks.length) {
      Promise.all(asyncTasks.map((task) => runWithAuthScope(authData, task))).catch(
        (err) => {
          console.error(`[push] async tasks failed`, err)
        }
      )
    }

    return {
      response,
      asyncTasks,
    }
  }

  const handleQueryRequest = async ({
    authData,
    request,
  }: {
    authData: AuthData | null
    request: Request
  }) => {
    if (!queries) {
      throw new Error(
        'No queries registered with createZeroServer. ' +
          'Pass the syncedQueries registry to createZeroServer via the queries option.'
      )
    }

    const response = await runWithQueryContext(
      { authData: authData || ({} as AuthData) },
      () =>
        zeroHandleQueryRequest(
          (name, args) => {
            // per-model permission queries registered by on-zero at runtime
            if (name.startsWith('permission.')) {
              const table = name.slice('permission.'.length)
              const { objOrId } = args as {
                objOrId: string | Record<string, any>
              }
              const perm = getMutationsPermissions(table)
              if (!perm) {
                throw new Error(`[permission] no permission defined for table: ${table}`)
              }
              // wrap with setEvaluatingPermission so serverWhere evaluates
              // even when environment is 'client' (SSR hydration)
              setEvaluatingPermission(true)
              try {
                return (getZQL() as any)[table]
                  .where((eb: any) => {
                    return permissions.buildPermissionQuery(
                      authData,
                      eb,
                      perm,
                      objOrId,
                      table
                    )
                  })
                  .one()
              } finally {
                setEvaluatingPermission(false)
              }
            }

            // run validation hook if provided (must be sync - throw to reject)
            if (validateQuery) {
              validateQuery({ authData, queryName: name, params: args })
            }

            const query = (mustGetQuery as any)(queries, name)
            return query.fn({ args, ctx: authData })
          },
          schema,
          request
        )
    )

    return {
      response,
    }
  }

  async function runMutate(
    modelName: string,
    mutatorName: string,
    mutatorArg: unknown,
    options?: MutateOptions
  ) {
    let authData = options?.authData

    // auto-resolve authData from mutation context or auth scope
    if (!authData) {
      const scoped = getScopedAuthData()
      if (scoped) {
        authData = scoped as MutateAuthData
      }
    }

    const asyncTasks: Array<() => Promise<void>> = []

    const mutators = createMutators({
      models,
      environment: 'server',
      asyncTasks,
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

    await transaction(async (tx) => {
      await mutator(tx, mutatorArg)
    })

    if (asyncTasks.length) {
      const resolvedAuth = authData ?? null
      const promise = Promise.all(
        asyncTasks.map((t) => runWithAuthScope(resolvedAuth, t))
      )
      if (options?.awaitEffects) {
        await promise
      } else {
        promise.catch((err) => {
          console.error(`[mutate] async tasks failed`, err)
        })
      }
    }
  }

  // zeroServer.mutate.user.insert(user)
  const mutate = new Proxy({} as ServerMutate<Models>, {
    get(_, modelName: string) {
      return new Proxy(
        {},
        {
          get(_, mutatorName: string) {
            return (arg: unknown, options?: MutateOptions) =>
              runMutate(modelName, mutatorName, arg, options)
          },
        }
      )
    },
  })

  async function transaction<
    CB extends (tx: Transaction) => Promise<any>,
    Returns extends CB extends (tx: Transaction) => Promise<infer X> ? X : never,
  >(query: CB): Promise<Returns> {
    try {
      if (isInZeroMutation()) {
        const { tx } = mutatorContext()
        return await query(tx)
      }
      // @ts-expect-error type
      const output = await zeroDb.transaction(query, dummyTransactionInput)
      return output
    } catch (err) {
      console.error(`Error running transaction(): ${err}`)
      throw err
    }
  }

  function query<R>(
    cb: (q: QueryBuilder) => Query<any, Schema, R>,
    authData?: AuthData | null
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

  // register for global run() helper
  if (queries) {
    setCustomQueries(queries)
  }

  // server uses transaction-based execution
  setRunner((queryObj) => {
    return transaction(async (tx) => {
      return tx.run(queryObj)
    })
  })

  // This is needed temporarily and will be cleaned up in the future.
  const dummyTransactionInput: TransactionProviderInput = {
    clientGroupID: 'unused',
    clientID: 'unused',
    mutationID: 42,
    upstreamSchema: 'unused',
  }

  return {
    handleMutationRequest,
    handleQueryRequest,
    transaction,
    mutate,
    query,
  }
}
