import { getTableName } from 'drizzle-orm'
import { PgTable } from 'drizzle-orm/pg-core'

import { createDrizzle } from './createDrizzle'
import { createPool, type CreatePoolOptions } from './createPool'
import { createServerHelpers } from './createServerHelpers'
import { getDBClient } from './getDBClient'
import { migrate } from './migrate'
import { waitForDatabase } from './waitForDatabase'
import {
  ensureZeroDatabases,
  ensureZeroPublication,
  ensureZeroSeeds,
  ensureZeroTriggers,
  type SeedDefinition,
  type TriggerDefinition,
} from './zero'

import type { AnyRelations, EmptyRelations } from 'drizzle-orm'

export type DatabaseConfig<
  TSchema extends Record<string, unknown>,
  TRelations extends AnyRelations = EmptyRelations,
> = {
  connectionString: string
  schema: TSchema
  relations?: TRelations
  pool?: Omit<CreatePoolOptions, 'connectionString'>
  zero?: {
    publicationName: string
    publicTables: string[]
    triggers?: TriggerDefinition[]
    seeds?: SeedDefinition[]
  }
}

export type MigrateOptions = {
  migrationsGlob: Record<string, () => Promise<unknown>>
  cvrDb?: string
  changeDb?: string
  createDatabases?: string[]
  gitSha?: string
  defaultTimeout?: number
  onMigrationComplete?: () => Promise<void>
}

function stripQueryParams(connStr: string | undefined): string | undefined {
  if (!connStr) return connStr
  return connStr.split('?')[0]
}

export function createDatabase<
  TSchema extends Record<string, unknown>,
  TRelations extends AnyRelations = EmptyRelations,
>(config: DatabaseConfig<TSchema, TRelations>) {
  const { connectionString, schema, relations, zero } = config

  const pool = createPool({
    connectionString,
    ...config.pool,
  })

  const drizzle = createDrizzle({
    pool,
    schema,
    relations,
  })

  const { sql, getDBClient: getBoundDBClient } = createServerHelpers(pool)

  const allTableNames = Object.values(schema)
    .filter((v): v is PgTable => v instanceof PgTable)
    .map((t) => getTableName(t))

  const publicTableSet = new Set(zero?.publicTables || [])
  const privateTableNames = allTableNames.filter((n) => !publicTableSet.has(n))

  async function close() {
    try {
      await pool.end()
    } catch (e) {
      console.error('[database] error closing:', e)
    }
  }

  async function runMigrate(options: MigrateOptions) {
    console.info('[database] waiting for database to be ready...')
    await waitForDatabase(connectionString)

    console.info('[database] running migrations...')
    await migrate({
      connectionString,
      migrationsGlob: options.migrationsGlob,
      cvrDb: stripQueryParams(options.cvrDb),
      changeDb: stripQueryParams(options.changeDb),
      createDatabases: options.createDatabases,
      gitSha: options.gitSha,
      defaultTimeout: options.defaultTimeout,
      skipExit: true,
      onMigrationComplete: async () => {
        if (zero) {
          await ensureZeroPublication({
            connectionString,
            publicationName: zero.publicationName,
            privateTableNames,
          })

          if (zero.triggers?.length || zero.seeds?.length) {
            const client = await getDBClient({ connectionString })
            try {
              if (zero.triggers?.length) {
                await ensureZeroTriggers(client, zero.triggers)
              }
              if (zero.seeds?.length) {
                await ensureZeroSeeds(client, zero.seeds)
              }
            } finally {
              client.release()
            }
          }
        }

        if (options.onMigrationComplete) {
          await options.onMigrationComplete()
        }
      },
    })
    console.info('[database] migrations complete')
    await close()
    process.exit(0)
  }

  return {
    pool,
    drizzle,
    sql,
    getDBClient: getBoundDBClient,
    close,
    migrate: runMigrate,
    privateTableNames,
    config,
  }
}
