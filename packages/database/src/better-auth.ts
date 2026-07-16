import { drizzleAdapter, type DrizzleAdapterConfig } from 'better-auth/adapters/drizzle'

import {
  createSQLiteDrizzle,
  type CreateSQLiteDatabaseOptions,
  type SQLiteSchema,
  type SQLiteTransactionExecutor,
} from './sqlite'

import type { AnyRelations, EmptyRelations } from 'drizzle-orm'

export type CreateBetterAuthSQLiteAdapterOptions<
  TSchema extends SQLiteSchema,
  TRelations extends AnyRelations = EmptyRelations,
> = Pick<
  CreateSQLiteDatabaseOptions<TSchema, TRelations>,
  'relations' | 'schema' | 'transactionProvider'
> &
  Omit<DrizzleAdapterConfig, 'provider' | 'schema' | 'transaction'>

/**
 * gives Better Auth its official Drizzle adapter inside the transaction
 * callback owned by the SQLite host. the Drizzle adapter's transaction mode
 * stays disabled because it must never emit its own BEGIN or COMMIT.
 */
export function createBetterAuthSQLiteAdapter<
  TSchema extends SQLiteSchema,
  TRelations extends AnyRelations = EmptyRelations,
>(
  options: CreateBetterAuthSQLiteAdapterOptions<TSchema, TRelations>,
): ReturnType<typeof drizzleAdapter> {
  const { relations, schema, transactionProvider, ...drizzleOptions } = options
  const adapterConfig = {
    ...drizzleOptions,
    provider: 'sqlite',
    schema,
    transaction: false,
  } satisfies DrizzleAdapterConfig
  const createAdapter = (
    executor: SQLiteTransactionExecutor,
    authOptions: Parameters<ReturnType<typeof drizzleAdapter>>[0],
  ) =>
    drizzleAdapter(
      createSQLiteDrizzle(executor, { relations, schema }),
      adapterConfig,
    )(authOptions)

  return (authOptions) => {
    const unavailableExecutor: SQLiteTransactionExecutor = {
      exec() {
        throw new Error('Better Auth SQLite operations require a transaction callback')
      },
      query() {
        throw new Error('Better Auth SQLite operations require a transaction callback')
      },
      queryAst() {
        throw new Error('Better Auth SQLite operations require a transaction callback')
      },
    }
    const target = createAdapter(unavailableExecutor, authOptions)
    const transaction: typeof target.transaction = (work) =>
      transactionProvider(async (executor) => work(createAdapter(executor, authOptions)))

    return new Proxy(target, {
      get(_target, property, receiver) {
        if (property === 'transaction') return transaction

        const value = Reflect.get(target, property, receiver)
        if (typeof value !== 'function') return value

        return (...args: unknown[]) =>
          transactionProvider(async (executor) => {
            const adapter = createAdapter(executor, authOptions)
            const operation = Reflect.get(adapter, property)
            if (typeof operation !== 'function') {
              throw new TypeError(
                `Better Auth adapter operation ${String(property)} is unavailable`,
              )
            }
            return Reflect.apply(operation, adapter, args)
          })
      },
    })
  }
}
