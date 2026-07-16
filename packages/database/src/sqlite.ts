import { drizzle, type SqliteRemoteDatabase } from 'drizzle-orm/sqlite-proxy'
import { AsyncLocalStorage } from 'node:async_hooks'

import type { AnyRelations, EmptyRelations } from 'drizzle-orm'
import type { SQLiteTable } from 'drizzle-orm/sqlite-core'
import type { Database, SQLQueryBindings } from 'bun:sqlite'

export type SqlStatementMetadata = {
  table: string
  publicTable: string
  kind: 'delete' | 'insert' | 'update' | 'upsert'
}

export type SQLiteQueryFormat = {
  relationships: Record<string, SQLiteQueryFormat>
  singular: boolean
}

export type SQLiteExecResult = {
  changes: number
}

export type SQLiteTransactionExecutor = {
  exec(
    sql: string,
    params?: readonly unknown[],
    metadata?: SqlStatementMetadata,
  ): SQLiteExecResult | Promise<SQLiteExecResult>
  query<Row extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: readonly unknown[],
  ): Row[] | Promise<Row[]>
  queryAst<Result = unknown>(
    ast: unknown,
    format: SQLiteQueryFormat,
    queryName?: string,
  ): Result | Promise<Result>
}

export type SQLiteTransactionProvider = <Value>(
  work: (executor: SQLiteTransactionExecutor) => Value | Promise<Value>,
) => Promise<Value>

export type SQLiteSchema = Record<string, SQLiteTable>

export type CreateSQLiteDatabaseOptions<
  TSchema extends SQLiteSchema,
  TRelations extends AnyRelations = EmptyRelations,
> = {
  schema: TSchema
  relations?: TRelations
  transactionProvider: SQLiteTransactionProvider
}

export type SQLiteDatabaseTransaction<
  TSchema extends SQLiteSchema,
  TRelations extends AnyRelations,
> = {
  executor: SQLiteTransactionExecutor
  drizzle: SqliteRemoteDatabase<TSchema, TRelations>
}

export type SQLiteDatabase<
  TSchema extends SQLiteSchema,
  TRelations extends AnyRelations,
> = {
  transaction<Value>(
    work: (
      transaction: SQLiteDatabaseTransaction<TSchema, TRelations>,
    ) => Value | Promise<Value>,
  ): Promise<Value>
}

/**
 * Creates Drizzle only after the storage owner has started its transaction.
 * The sqlite-proxy driver is used solely to turn its query callbacks into
 * typed Drizzle operations; it never owns BEGIN or COMMIT.
 */
export function createSQLiteDatabase<
  TSchema extends SQLiteSchema,
  TRelations extends AnyRelations = EmptyRelations,
>(
  options: CreateSQLiteDatabaseOptions<TSchema, TRelations>,
): SQLiteDatabase<TSchema, TRelations> {
  return {
    transaction(work) {
      return options.transactionProvider(async (executor) =>
        work({
          executor,
          drizzle: createSQLiteDrizzle(executor, options),
        }),
      )
    },
  }
}

export function createSQLiteDrizzle<
  TSchema extends SQLiteSchema,
  TRelations extends AnyRelations = EmptyRelations,
>(
  executor: SQLiteTransactionExecutor,
  options: Pick<CreateSQLiteDatabaseOptions<TSchema, TRelations>, 'relations' | 'schema'>,
): SqliteRemoteDatabase<TSchema, TRelations> {
  return drizzle<TSchema, TRelations>(
    async (sql, params, method) => {
      if (method === 'run') {
        const result = await executor.exec(sql, params)
        return { changes: result.changes, rows: [] }
      }

      const rows = await executor.query(sql, params)
      if (method === 'get') {
        const row = rows[0]
        return remoteRows(row ? rowValues(row) : undefined)
      }
      return remoteRows(rows.map(rowValues))
    },
    {
      schema: options.schema,
      relations: options.relations,
    },
  )
}

export type CreateBunSQLiteExecutorOptions = {
  database: Database
  queryAst<Result = unknown>(
    ast: unknown,
    format: SQLiteQueryFormat,
    queryName?: string,
  ): Result | Promise<Result>
}

export function createBunSQLiteExecutor({
  database,
  queryAst,
}: CreateBunSQLiteExecutorOptions): SQLiteTransactionExecutor {
  return {
    exec(sql, params = []) {
      const result = database.prepare(sql).run(...bunBindings(params))
      return { changes: result.changes }
    },
    query<Row extends Record<string, unknown>>(
      sql: string,
      params: readonly unknown[] = [],
    ): Row[] {
      return database.prepare<Row, SQLQueryBindings[]>(sql).all(...bunBindings(params))
    },
    queryAst,
  }
}

export type CreateBunSQLiteTransactionProviderOptions = CreateBunSQLiteExecutorOptions

/**
 * Bun's synchronous driver needs its own native transaction boundary. Remote
 * and Durable Object hosts pass their protected callback directly to
 * createSQLiteDatabase instead.
 */
export function createBunSQLiteTransactionProvider({
  database,
  queryAst,
}: CreateBunSQLiteTransactionProviderOptions): SQLiteTransactionProvider {
  const executor = createBunSQLiteExecutor({ database, queryAst })
  const transactionContext = new AsyncLocalStorage<boolean>()
  let tail = Promise.resolve()

  return async (work) => {
    if (transactionContext.getStore()) {
      throw new Error('nested SQLite transactions are not supported')
    }
    // keep the native connection's transaction state exclusive across awaits.
    const previous = tail
    let release!: () => void
    tail = new Promise<void>((resolve) => {
      release = resolve
    })

    await previous
    try {
      return await transactionContext.run(true, async () => {
        let began = false
        try {
          database.exec('BEGIN')
          began = true
          const value = await work(executor)
          database.exec('COMMIT')
          began = false
          return value
        } catch (error) {
          if (began) database.exec('ROLLBACK')
          throw error
        }
      })
    } finally {
      release()
    }
  }
}

function rowValues(row: Record<string, unknown>): unknown[] {
  return Object.values(row)
}

function remoteRows(rows: unknown[] | undefined): { rows: any[] } {
  // Drizzle's sqlite-proxy declaration requires an array even though its get()
  // implementation recognizes an absent row. Keep that transport mismatch at
  // this one adapter boundary rather than turning a missing row into one full
  // of undefined column values.
  return { rows: rows as any[] }
}

function bunBindings(params: readonly unknown[]): SQLQueryBindings[] {
  // on-zero accepts unknown bindings so every native provider can expose one
  // structural contract. Bun validates these at its typed boundary.
  return params as SQLQueryBindings[]
}
