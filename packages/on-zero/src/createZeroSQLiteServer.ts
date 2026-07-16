import { createZeroServerCore } from './createZeroServerCore'
import {
  createSQLiteDatabase,
  defaultLedgerTables,
  encodeSQLiteValue,
  persistAlreadyProcessedMutationResults,
  type SQLiteLedgerTables,
  type SQLiteTransactionProvider,
  type SQLiteValueContext,
} from './sqliteRuntime'

import type { ZeroServer, ZeroServerCommonOptions } from './createZeroServerCore'
import type { GenericModels } from './types'
import type { Schema as ZeroSchema } from '@rocicorp/zero'

export type CreateZeroSQLiteServerOptions<
  Schema extends ZeroSchema,
  Models extends GenericModels,
  ServerActions extends Record<string, unknown>,
> = ZeroServerCommonOptions<Schema, Models, ServerActions> & {
  transactionProvider: SQLiteTransactionProvider
  ledgerTables?: (upstreamSchema: string) => SQLiteLedgerTables
  encodeValue?: (value: unknown, context: SQLiteValueContext) => unknown
}

export function createZeroSQLiteServer<
  Schema extends ZeroSchema,
  Models extends GenericModels,
  ServerActions extends Record<string, unknown>,
>({
  encodeValue = encodeSQLiteValue,
  ledgerTables = defaultLedgerTables,
  transactionProvider,
  ...options
}: CreateZeroSQLiteServerOptions<Schema, Models, ServerActions>): ZeroServer<
  Schema,
  Models,
  ServerActions
> {
  const databaseOptions = {
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

export * from './sqliteRuntime'
