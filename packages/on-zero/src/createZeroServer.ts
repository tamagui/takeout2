import { zeroNodePg } from '@rocicorp/zero/server/adapters/pg'
import { assertString } from '@take-out/helpers'
import { Pool } from 'pg'

import { createZeroServerCore } from './createZeroServerCore'

import type {
  PersistAlreadyProcessedArgs,
  ZeroServerCommonOptions,
  ZeroServerDatabase,
} from './createZeroServerCore'
import type { GenericModels } from './types'
import type { Schema as ZeroSchema } from '@rocicorp/zero'
import type { NodePgTransaction } from '@rocicorp/zero/server/adapters/pg'

export type {
  ValidateMutationArgs,
  ValidateMutationFn,
  ValidateQueryArgs,
  ValidateQueryFn,
} from './createZeroServerCore'

export function createZeroServer<
  Schema extends ZeroSchema,
  Models extends GenericModels,
  ServerActions extends Record<string, unknown>,
>({
  database,
  pool: externalPool,
  ...options
}: ZeroServerCommonOptions<Schema, Models, ServerActions> & {
  /**
   * Optional pre-built Pool-like object, such as a PGlite wrapper.
   * When provided, database is not required.
   */
  pool?: NodePgTransaction
  /**
   * The PostgreSQL connection string.
   * Not required when pool is provided.
   */
  database?: string
}) {
  let pool: NodePgTransaction
  if (externalPool) {
    pool = externalPool
  } else {
    const dbString = assertString(database, 'createZeroServer "database"')
    const pgPool = new Pool({
      connectionString: dbString,
      ssl: dbString.includes('sslmode=require')
        ? { rejectUnauthorized: false }
        : undefined,
    })
    pgPool.on('error', (error) => {
      console.error('[on-zero] pool error', error.message)
    })
    pgPool.on('connect', (client) => {
      client.on('error', (error) => {
        console.error('[on-zero] client error', error.message)
      })
    })
    pool = pgPool
  }

  const databaseProvider = zeroNodePg(options.schema, pool)

  return createZeroServerCore({
    ...options,
    createDatabase: () => databaseProvider as unknown as ZeroServerDatabase,
    persistAlreadyProcessed: (args) => persistAlreadyProcessedMutationResults(pool, args),
  })
}

async function persistAlreadyProcessedMutationResults(
  pool: NodePgTransaction,
  { clientGroupID, mutations, upstreamSchema }: PersistAlreadyProcessedArgs,
) {
  const table = `${quotePgIdentifier(upstreamSchema)}."mutations"`
  const values = mutations
    .map((_, index) => {
      const offset = index * 4
      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}::json)`
    })
    .join(', ')
  const params = mutations.flatMap((mutation) => [
    clientGroupID,
    mutation.id.clientID,
    mutation.id.id,
    JSON.stringify(mutation.result),
  ])

  await pool.query(
    `INSERT INTO ${table} ("clientGroupID", "clientID", "mutationID", "result")
     VALUES ${values}
     ON CONFLICT ("clientGroupID", "clientID", "mutationID") DO NOTHING`,
    params,
  )
}

function quotePgIdentifier(value: string) {
  return `"${value.replaceAll('"', '""')}"`
}
