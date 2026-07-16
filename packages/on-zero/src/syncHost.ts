import { asQueryInternals } from '@rocicorp/zero/bindings'

import { createPermissions } from './createPermissions'
import { resolveServerQuery, type ZeroServerCommonOptions } from './createZeroServerCore'
import {
  createZeroSQLiteServer,
  createZeroSQLiteTransaction,
  type SqlStatementMetadata,
  type SQLiteRunResult,
  type SQLiteTransactionExecutor,
  type ZeroSQLiteTransactionOptions,
} from './createZeroSQLiteServer'
import { createMutators } from './helpers/createMutators'
import { runWithAuthScope } from './helpers/mutatorContext'
import { runWithQueryContext } from './helpers/queryContext'
import { setEnvironment, setSchema } from './state'

import type { AuthData, GenericModels } from './types'
import type { Schema as ZeroSchema } from '@rocicorp/zero'

export type SyncHostJsonValue =
  | string
  | number
  | boolean
  | null
  | SyncHostJsonValue[]
  | { [key: string]: SyncHostJsonValue }

export type SyncHostClaims = {
  userID: string
  [claim: string]: SyncHostJsonValue
}

export type SyncHostTransactionContext = {
  defer(effect: () => void | Promise<void>): void
}

export type SyncHostTransactionExecutor = {
  exec(
    sql: string,
    params?: readonly unknown[],
    metadata?: SqlStatementMetadata,
  ): SQLiteRunResult | Promise<SQLiteRunResult>
  query<Row extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: readonly unknown[],
  ): Row[] | Promise<Row[]>
  queryAst<Result = unknown>(
    ast: SyncHostJsonValue,
    format: import('./createZeroSQLiteServer').SQLiteQueryFormat,
    queryName?: string,
  ): Result | Promise<Result>
}

export type SyncHostMutatorContext = SyncHostTransactionContext & {
  claims: SyncHostClaims
  clientID?: string
  mutationID?: string | number
}

export type SyncHostRegisteredMutator = (
  tx: SyncHostTransactionExecutor,
  args: SyncHostJsonValue,
  context: SyncHostMutatorContext,
) => void | Promise<void>

export type SyncHostApplicationTransaction = <Value>(
  work: (
    tx: SyncHostTransactionExecutor,
    context: SyncHostTransactionContext,
  ) => Value | Promise<Value>,
) => Promise<Value>

export type CreateZeroSyncHostAdapterOptions<
  Schema extends ZeroSchema,
  Models extends GenericModels,
  ServerActions extends Record<string, unknown>,
> = Omit<
  ZeroServerCommonOptions<Schema, Models, ServerActions>,
  'defaultMutateAuthData'
> &
  ZeroSQLiteTransactionOptions<Schema> & {
    transaction: SyncHostApplicationTransaction
    mapAuthData?: (claims: SyncHostClaims) => AuthData
    defaultMutateAuthData?: Pick<AuthData, 'email' | 'id'> & Partial<AuthData>
  }

export class MutationApplicationError extends Error {
  constructor(
    readonly details: string,
    message = details,
  ) {
    super(message)
    this.name = 'MutationApplicationError'
  }
}

export function createZeroSyncHostAdapter<
  Schema extends ZeroSchema,
  Models extends GenericModels,
  ServerActions extends Record<string, unknown>,
>({
  encodeValue,
  mapAuthData = defaultMapAuthData,
  transaction,
  ...options
}: CreateZeroSyncHostAdapterOptions<Schema, Models, ServerActions>) {
  setSchema(options.schema)
  setEnvironment('server')

  const permissions = createPermissions({
    environment: 'server',
    schema: options.schema,
    adminRoleMode: options.defaultAllowAdminRole ?? 'all',
  })
  const transactionOptions = {
    encodeValue,
    schema: options.schema,
  }
  const mutators: Record<string, SyncHostRegisteredMutator> = {}

  for (const [modelName, model] of Object.entries(options.models)) {
    for (const mutatorName of Object.keys(model.mutate ?? {})) {
      mutators[`${modelName}|${mutatorName}`] = async (executor, args, context) => {
        const authData = mapAuthData(context.claims)
        const asyncTasks: Array<() => Promise<void>> = []
        const modelMutators = createMutators({
          asyncTasks,
          authData,
          can: permissions.can,
          createServerActions: options.createServerActions,
          environment: 'server',
          models: options.models,
          mutationValidators: options.mutations,
          validateMutation: options.validateMutation,
        }) as Record<
          string,
          Record<string, (tx: unknown, args: unknown) => Promise<void>>
        >
        const mutation = modelMutators[modelName]?.[mutatorName]
        if (!mutation)
          throw new Error(`unknown on-zero mutator: ${modelName}|${mutatorName}`)

        const mutationID = numericMutationID(context.mutationID)
        const onZeroTransaction = createZeroSQLiteTransaction(
          transactionOptions,
          toSQLiteExecutor(executor),
          {
            clientGroupID: 'orez-sync-host',
            clientID: context.clientID ?? '',
            mutationID,
            upstreamSchema: 'orez-sync-host',
          },
        )
        try {
          await mutation(onZeroTransaction, args)
        } catch (error) {
          throw asMutationApplicationError(error)
        }
        for (const task of asyncTasks) {
          context.defer(() => runWithAuthScope(authData, task))
        }
      }
    }
  }

  // orez owns result retention and lmids. zero clients may still emit this
  // protocol mutation, so accepting it advances the host ledger without
  // creating a second on-zero cleanup ledger.
  mutators._zero_cleanupResults = async () => {}

  const direct = createZeroSQLiteServer({
    ...options,
    encodeValue,
    transactionProvider: (work) =>
      transaction((executor) => work(toSQLiteExecutor(executor))),
  })

  return {
    mutators: Object.freeze(mutators),
    async resolveQuery(
      name: string,
      args: readonly SyncHostJsonValue[],
      claims: SyncHostClaims,
    ): Promise<SyncHostJsonValue> {
      if (!options.queries) {
        throw new Error(
          'No queries registered with createZeroSyncHostAdapter. Pass the syncedQueries registry via the queries option.',
        )
      }
      const authData = mapAuthData(claims)
      const query = await runWithQueryContext({ authData }, () =>
        resolveServerQuery({
          authData,
          args: args[0],
          name,
          permissions,
          queries: options.queries!,
          validateQuery: options.validateQuery,
        }),
      )
      return asQueryInternals(query as never).ast as unknown as SyncHostJsonValue
    },
    server: {
      mutate: direct.mutate,
      query: direct.query,
      transaction: direct.transaction,
    },
  }
}

function defaultMapAuthData(claims: SyncHostClaims): AuthData {
  return {
    ...claims,
    id: typeof claims.id === 'string' ? claims.id : claims.userID,
  } as AuthData
}

function toSQLiteExecutor(
  executor: SyncHostTransactionExecutor,
): SQLiteTransactionExecutor {
  return {
    exec(sql, params, metadata) {
      return executor.exec(sql, params, metadata)
    },
    query<Row extends Record<string, unknown>>(sql: string, params?: readonly unknown[]) {
      return executor.query<Row>(sql, params)
    },
    queryAst<Result>(ast, format, queryName) {
      return executor.queryAst<Result>(
        ast as unknown as SyncHostJsonValue,
        format,
        queryName,
      )
    },
  }
}

function numericMutationID(value: string | number | undefined): number {
  if (value === undefined) return 0
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isSafeInteger(numeric) || numeric < 0) {
    throw new TypeError(`invalid Zero mutation ID: ${value}`)
  }
  return numeric
}

function asMutationApplicationError(error: unknown): MutationApplicationError {
  if (
    typeof error === 'object' &&
    error !== null &&
    (error as { name?: unknown }).name === 'MutationApplicationError' &&
    typeof (error as { details?: unknown }).details === 'string'
  ) {
    return error as MutationApplicationError
  }
  const message = error instanceof Error ? error.message : String(error)
  const applicationError = new MutationApplicationError(message)
  if (error instanceof Error && error.stack) applicationError.stack = error.stack
  return applicationError
}
