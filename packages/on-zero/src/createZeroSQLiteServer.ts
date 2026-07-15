import { createBuilder } from '@rocicorp/zero'
import { asQueryInternals } from '@rocicorp/zero/bindings'

import {
  createZeroServerCore,
  type PersistAlreadyProcessedArgs,
  type ZeroServerCommonOptions,
  type ZeroServerDatabase,
} from './createZeroServerCore'

import type { GenericModels, Transaction } from './types'
import type { AST, Schema as ZeroSchema } from '@rocicorp/zero'
import type {
  TransactionProviderHooks,
  TransactionProviderInput,
} from '@rocicorp/zero/server'

export type SQLiteTransactionExecutor = {
  exec(sql: string, params?: readonly unknown[]): void | Promise<void>
  query<Row extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: readonly unknown[],
  ): Row[] | Promise<Row[]>
  queryAst<Row extends Record<string, unknown> = Record<string, unknown>>(
    ast: AST,
    format?: SQLiteQueryFormat,
  ): Row[] | Promise<Row[]>
}

export type SQLiteQueryFormat = {
  relationships: Record<string, SQLiteQueryFormat>
  singular: boolean
}

export type SQLiteTransactionProvider = <R>(
  callback: (tx: SQLiteTransactionExecutor) => Promise<R>,
) => Promise<R>

type SQLiteColumn = ZeroSchema['tables'][string]['columns'][string]

export type SQLiteValueContext = {
  column: SQLiteColumn
  columnName: string
  tableName: string
}

export type SQLiteLedgerTables = {
  clients: string
  mutations: string
}

export type CreateZeroSQLiteServerOptions<
  Schema extends ZeroSchema,
  Models extends GenericModels,
  ServerActions extends Record<string, unknown>,
> = ZeroServerCommonOptions<Schema, Models, ServerActions> & {
  transactionProvider: SQLiteTransactionProvider
  ledgerTables?: (upstreamSchema: string) => SQLiteLedgerTables
  encodeValue?: (value: unknown, context: SQLiteValueContext) => unknown
  decodeValue?: (value: unknown, context: SQLiteValueContext) => unknown
}

export function createZeroSQLiteServer<
  Schema extends ZeroSchema,
  Models extends GenericModels,
  ServerActions extends Record<string, unknown>,
>({
  decodeValue = decodeSQLiteValue,
  encodeValue = encodeSQLiteValue,
  ledgerTables = defaultLedgerTables,
  transactionProvider,
  ...options
}: CreateZeroSQLiteServerOptions<Schema, Models, ServerActions>) {
  const databaseOptions = {
    decodeValue,
    encodeValue,
    initializedLedgers: new Set<string>(),
    ledgerTables,
    schema: options.schema,
    transactionProvider,
  }

  return createZeroServerCore({
    ...options,
    createDatabase: () => createSQLiteDatabase(databaseOptions),
    persistAlreadyProcessed: (args) =>
      persistAlreadyProcessedMutationResults(databaseOptions, args),
  })
}

type SQLiteDatabaseOptions<Schema extends ZeroSchema> = {
  decodeValue: (value: unknown, context: SQLiteValueContext) => unknown
  encodeValue: (value: unknown, context: SQLiteValueContext) => unknown
  initializedLedgers: Set<string>
  ledgerTables: (upstreamSchema: string) => SQLiteLedgerTables
  schema: Schema
  transactionProvider: SQLiteTransactionProvider
}

function createSQLiteDatabase<Schema extends ZeroSchema>(
  options: SQLiteDatabaseOptions<Schema>,
): ZeroServerDatabase {
  return {
    async transaction<R>(
      callback: (
        tx: Transaction,
        transactionHooks: TransactionProviderHooks,
      ) => R | Promise<R>,
      input?: TransactionProviderInput,
    ) {
      let committedLedgers = new Set<string>()
      const value = await options.transactionProvider(async (executor) => {
        const attemptLedgers = new Set<string>()
        const ensureLedger = async (upstreamSchema: string) => {
          const tables = options.ledgerTables(upstreamSchema)
          const key = ledgerKey(tables)
          if (options.initializedLedgers.has(key) || attemptLedgers.has(key)) {
            return
          }
          await createLedgerTables(executor, tables)
          attemptLedgers.add(key)
        }
        const transaction = createSQLiteTransaction(options, executor, input)
        const result = await callback(
          transaction,
          createLedgerHooks(options, executor, ensureLedger, input),
        )
        committedLedgers = attemptLedgers
        return result
      })
      for (const key of committedLedgers) options.initializedLedgers.add(key)
      return value
    },
  }
}

function createSQLiteTransaction<Schema extends ZeroSchema>(
  options: SQLiteDatabaseOptions<Schema>,
  executor: SQLiteTransactionExecutor,
  input?: TransactionProviderInput,
): Transaction {
  const clientID = input?.clientID ?? ''
  const mutationID = input?.mutationID ?? 0
  const mutate = new Proxy(
    {},
    {
      get(_target, tableKey) {
        const tableName = String(tableKey)
        if (!options.schema.tables[tableName]) {
          throw new Error(`unknown SQLite mutation table ${tableName}`)
        }
        return new Proxy(
          {},
          {
            get(_innerTarget, kindKey) {
              const kind = String(kindKey)
              if (!isCrudKind(kind)) return
              return (value: unknown) =>
                executeCrud(options, executor, tableName, kind, value)
            },
          },
        )
      },
    },
  )

  const runQuery = async (ast: AST, format: SQLiteQueryFormat): Promise<unknown> => {
    const rows = await executor.queryAst(ast, format)
    const decoded = rows.map((row) => decodeQueryRow(options, ast, format, row))
    return format.singular ? decoded[0] : decoded
  }
  const dbTransaction = {
    wrappedTransaction: executor,
    query: (sql: string, args: unknown[]) => executor.query(sql, args),
    runQuery,
  }

  return {
    clientID,
    dbTransaction,
    location: 'server',
    mutate,
    mutationID,
    query: options.schema.enableLegacyQueries
      ? createLegacyQueryBuilder(options.schema, (query) => {
          const internals = asQueryInternals(query as never)
          return runQuery(internals.ast, internals.format)
        })
      : undefined,
    reason: 'authoritative',
    async run(query: unknown) {
      const internals = asQueryInternals(query as never)
      return runQuery(internals.ast, internals.format)
    },
  } as unknown as Transaction
}

type CrudKind = 'delete' | 'insert' | 'update' | 'upsert'

function isCrudKind(value: string): value is CrudKind {
  return (
    value === 'delete' || value === 'insert' || value === 'update' || value === 'upsert'
  )
}

async function executeCrud<Schema extends ZeroSchema>(
  options: SQLiteDatabaseOptions<Schema>,
  executor: SQLiteTransactionExecutor,
  tableName: string,
  kind: CrudKind,
  raw: unknown,
) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error(`${tableName}.${kind} expects an object`)
  }

  const table = options.schema.tables[tableName]!
  const values = Object.fromEntries(
    Object.entries(raw as Record<string, unknown>).filter(
      ([, value]) => value !== undefined,
    ),
  )
  for (const columnName of Object.keys(values)) {
    if (!table.columns[columnName]) {
      throw new Error(`unknown SQLite column ${tableName}.${columnName}`)
    }
  }

  const primaryValues = table.primaryKey.map((columnName) => {
    if (!(columnName in values)) {
      throw new Error(`${tableName}.${kind} is missing primary key ${columnName}`)
    }
    return encodeColumn(options, tableName, columnName, values[columnName])
  })
  const primaryWhere = table.primaryKey
    .map((columnName) => `${quoteSQLiteIdentifier(serverColumn(table, columnName))} = ?`)
    .join(' AND ')
  const serverTableName = quoteSQLiteIdentifier(table.serverName ?? table.name)

  if (kind === 'delete') {
    await executor.exec(
      `DELETE FROM ${serverTableName} WHERE ${primaryWhere}`,
      primaryValues,
    )
    return
  }

  const columnNames = Object.keys(values)
  if (columnNames.length === 0) {
    throw new Error(`${tableName}.${kind} has no values`)
  }

  const serverColumns = columnNames.map((columnName) =>
    quoteSQLiteIdentifier(serverColumn(table, columnName)),
  )
  const params = columnNames.map((columnName) =>
    encodeColumn(options, tableName, columnName, values[columnName]),
  )
  const insert = `INSERT INTO ${serverTableName} (${serverColumns.join(
    ', ',
  )}) VALUES (${columnNames.map(() => '?').join(', ')})`

  if (kind === 'insert') {
    await executor.exec(insert, params)
    return
  }

  if (kind === 'upsert') {
    const mutableColumns = columnNames.filter(
      (columnName) => !table.primaryKey.includes(columnName),
    )
    const conflictColumns = table.primaryKey
      .map((columnName) => quoteSQLiteIdentifier(serverColumn(table, columnName)))
      .join(', ')
    const conflictAction =
      mutableColumns.length === 0
        ? 'DO NOTHING'
        : `DO UPDATE SET ${mutableColumns
            .map((columnName) => {
              const column = quoteSQLiteIdentifier(serverColumn(table, columnName))
              return `${column} = excluded.${column}`
            })
            .join(', ')}`
    await executor.exec(
      `${insert} ON CONFLICT (${conflictColumns}) ${conflictAction}`,
      params,
    )
    return
  }

  const mutableColumns = columnNames.filter(
    (columnName) => !table.primaryKey.includes(columnName),
  )
  if (mutableColumns.length === 0) return
  await executor.exec(
    `UPDATE ${serverTableName} SET ${mutableColumns
      .map(
        (columnName) => `${quoteSQLiteIdentifier(serverColumn(table, columnName))} = ?`,
      )
      .join(', ')} WHERE ${primaryWhere}`,
    [
      ...mutableColumns.map((columnName) =>
        encodeColumn(options, tableName, columnName, values[columnName]),
      ),
      ...primaryValues,
    ],
  )
}

function serverColumn(table: ZeroSchema['tables'][string], columnName: string) {
  const column = table.columns[columnName]
  if (!column) throw new Error(`unknown SQLite column ${table.name}.${columnName}`)
  return column.serverName ?? columnName
}

function encodeColumn<Schema extends ZeroSchema>(
  options: SQLiteDatabaseOptions<Schema>,
  tableName: string,
  columnName: string,
  value: unknown,
) {
  return options.encodeValue(value, {
    column: options.schema.tables[tableName]!.columns[columnName]!,
    columnName,
    tableName,
  })
}

function decodeRow<Schema extends ZeroSchema>(
  options: SQLiteDatabaseOptions<Schema>,
  tableName: string,
  row: Record<string, unknown>,
) {
  const table = options.schema.tables[tableName]
  if (!table) return row
  const decoded = { ...row }
  for (const [columnName, column] of Object.entries(table.columns)) {
    const physicalName = column.serverName ?? columnName
    const hasLogical = Object.hasOwn(row, columnName)
    const hasPhysical = Object.hasOwn(row, physicalName)
    if (!hasLogical && !hasPhysical) continue
    const value = hasLogical ? row[columnName] : row[physicalName]
    decoded[columnName] = options.decodeValue(value, {
      column,
      columnName,
      tableName,
    })
    if (physicalName !== columnName) delete decoded[physicalName]
  }
  return decoded
}

function decodeQueryRow<Schema extends ZeroSchema>(
  options: SQLiteDatabaseOptions<Schema>,
  ast: AST,
  format: SQLiteQueryFormat,
  row: Record<string, unknown>,
): Record<string, unknown> {
  const decoded = decodeRow(options, ast.table, row)
  for (const related of ast.related ?? []) {
    const junctionAst = related.subquery
    const relatedAst = related.hidden ? junctionAst.related?.[0]?.subquery : junctionAst
    if (!relatedAst) continue
    const name = junctionAst.alias ?? relatedAst.alias ?? relatedAst.table
    const relatedFormat = format.relationships[name]
    const value = decoded[name]
    if (!relatedFormat || value === null || value === undefined) continue
    if (Array.isArray(value)) {
      decoded[name] = value.map((child) =>
        child && typeof child === 'object' && !Array.isArray(child)
          ? decodeQueryRow(
              options,
              relatedAst,
              relatedFormat,
              child as Record<string, unknown>,
            )
          : child,
      )
    } else if (typeof value === 'object') {
      decoded[name] = decodeQueryRow(
        options,
        relatedAst,
        relatedFormat,
        value as Record<string, unknown>,
      )
    }
  }
  return decoded
}

function createLegacyQueryBuilder<Schema extends ZeroSchema>(
  schema: Schema,
  run: (query: unknown) => Promise<unknown>,
) {
  const builder = createBuilder(schema)
  return new Proxy(builder, {
    get(target, property) {
      return makeRunnableQuery(Reflect.get(target, property, target), run)
    },
  })
}

function makeRunnableQuery(
  query: unknown,
  run: (query: unknown) => Promise<unknown>,
): unknown {
  if (!isQueryBuilder(query)) return query
  return new Proxy(query as object, {
    get(target, property) {
      if (property === 'run') return () => run(target)
      if (property === 'materialize' || property === 'preload') {
        return () => {
          throw new Error(`${String(property)}() is not supported in server transactions`)
        }
      }
      const value = Reflect.get(target, property, target)
      if (typeof value !== 'function') return value
      return (...args: unknown[]) =>
        makeRunnableQuery(Reflect.apply(value, target, args), run)
    },
  })
}

function isQueryBuilder(value: unknown) {
  if (!value || typeof value !== 'object') return false
  try {
    asQueryInternals(value as never)
    return true
  } catch {
    return false
  }
}

function createLedgerHooks<Schema extends ZeroSchema>(
  options: SQLiteDatabaseOptions<Schema>,
  executor: SQLiteTransactionExecutor,
  ensureLedger: (upstreamSchema: string) => Promise<void>,
  input?: TransactionProviderInput,
): TransactionProviderHooks {
  const upstreamSchema = input?.upstreamSchema ?? ''
  const clientGroupID = input?.clientGroupID ?? ''
  const clientID = input?.clientID ?? ''
  const tables = options.ledgerTables(upstreamSchema)
  const clientsTable = quoteSQLiteIdentifier(tables.clients)
  const mutationsTable = quoteSQLiteIdentifier(tables.mutations)

  return {
    async updateClientMutationID() {
      await ensureLedger(upstreamSchema)
      const rows = await executor.query<{ lastMutationID: number | bigint }>(
        `INSERT INTO ${clientsTable}
           (clientGroupID, clientID, lastMutationID)
         VALUES (?, ?, 1)
         ON CONFLICT (clientGroupID, clientID)
         DO UPDATE SET lastMutationID = lastMutationID + 1
         RETURNING lastMutationID`,
        [clientGroupID, clientID],
      )
      const lastMutationID = rows[0]?.lastMutationID
      if (typeof lastMutationID !== 'number' && typeof lastMutationID !== 'bigint') {
        throw new Error('SQLite mutation ledger returned no lastMutationID')
      }
      return { lastMutationID }
    },
    async writeMutationResult(result) {
      await ensureLedger(upstreamSchema)
      await executor.exec(
        `INSERT INTO ${mutationsTable}
           (clientGroupID, clientID, mutationID, result)
         VALUES (?, ?, ?, ?)`,
        [clientGroupID, result.id.clientID, result.id.id, JSON.stringify(result.result)],
      )
    },
    async deleteMutationResults(args) {
      await ensureLedger(upstreamSchema)
      if ('type' in args && args.type === 'bulk') {
        if (args.clientIDs.length === 0) return
        await executor.exec(
          `DELETE FROM ${mutationsTable}
           WHERE clientGroupID = ?
             AND clientID IN (${args.clientIDs.map(() => '?').join(', ')})`,
          [args.clientGroupID, ...args.clientIDs],
        )
        return
      }
      await executor.exec(
        `DELETE FROM ${mutationsTable}
         WHERE clientGroupID = ?
           AND clientID = ?
           AND mutationID <= ?`,
        [args.clientGroupID, args.clientID, args.upToMutationID],
      )
    },
  }
}

async function persistAlreadyProcessedMutationResults<Schema extends ZeroSchema>(
  options: SQLiteDatabaseOptions<Schema>,
  { clientGroupID, mutations, upstreamSchema }: PersistAlreadyProcessedArgs,
) {
  const tables = options.ledgerTables(upstreamSchema)
  const table = quoteSQLiteIdentifier(tables.mutations)
  const key = ledgerKey(tables)
  await options.transactionProvider(async (executor) => {
    if (!options.initializedLedgers.has(key)) {
      await createLedgerTables(executor, tables)
    }
    for (const mutation of mutations) {
      await executor.exec(
        `INSERT INTO ${table}
           (clientGroupID, clientID, mutationID, result)
         VALUES (?, ?, ?, ?)
         ON CONFLICT (clientGroupID, clientID, mutationID) DO NOTHING`,
        [
          clientGroupID,
          mutation.id.clientID,
          mutation.id.id,
          JSON.stringify(mutation.result),
        ],
      )
    }
  })
  options.initializedLedgers.add(key)
}

async function createLedgerTables(
  executor: SQLiteTransactionExecutor,
  tables: SQLiteLedgerTables,
) {
  await executor.exec(
    `CREATE TABLE IF NOT EXISTS ${quoteSQLiteIdentifier(tables.clients)} (
       clientGroupID TEXT NOT NULL,
       clientID TEXT NOT NULL,
       lastMutationID INTEGER NOT NULL,
       PRIMARY KEY (clientGroupID, clientID)
     )`,
  )
  await executor.exec(
    `CREATE TABLE IF NOT EXISTS ${quoteSQLiteIdentifier(tables.mutations)} (
       clientGroupID TEXT NOT NULL,
       clientID TEXT NOT NULL,
       mutationID INTEGER NOT NULL,
       result TEXT NOT NULL,
       PRIMARY KEY (clientGroupID, clientID, mutationID)
     )`,
  )
}

function ledgerKey(tables: SQLiteLedgerTables) {
  return `${tables.clients}\0${tables.mutations}`
}

function defaultLedgerTables(upstreamSchema: string): SQLiteLedgerTables {
  const prefix = upstreamSchema ? `${upstreamSchema}_` : ''
  return {
    clients: `${prefix}clients`,
    mutations: `${prefix}mutations`,
  }
}

function encodeSQLiteValue(value: unknown, { column }: SQLiteValueContext) {
  if (value === null) return null
  if (column.type === 'boolean') return value ? 1 : 0
  if (column.type === 'json') return JSON.stringify(value)
  return value
}

function decodeSQLiteValue(value: unknown, { column }: SQLiteValueContext) {
  if (value === null) return null
  if (column.type === 'boolean') {
    return value !== false && value !== 0 && value !== '0'
  }
  if (column.type === 'json' && typeof value === 'string') {
    return JSON.parse(value)
  }
  return value
}

function quoteSQLiteIdentifier(value: string) {
  return `"${value.replaceAll('"', '""')}"`
}
