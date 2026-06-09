import { getTableName } from 'drizzle-orm'
import { PgTable } from 'drizzle-orm/pg-core'
import type { Pool } from 'pg'

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
  TRelations extends AnyRelations | Record<string, unknown> = EmptyRelations,
> = {
  /**
   * The PG connection string. Required unless a pre-built `pool` is provided
   * (it is still used by `migrate()` / `waitForDatabase()`, which need a string).
   */
  connectionString?: string
  schema: TSchema
  relations?: TRelations
  /**
   * Optional pre-built Pool-like client (e.g. a DoBackend-backed Pool for the
   * Cloudflare Durable Object runtime, where there is no external Postgres).
   * When provided, `createPool` is skipped and this pool is used directly —
   * mirrors `createZeroServer`'s `pool` option. `connectionString` is then only
   * needed for the migration helpers.
   */
  pool?: Pool
  /** Options forwarded to the default `createPool` (ignored when `pool` is set). */
  poolOptions?: Omit<CreatePoolOptions, 'connectionString'>
  zero?: {
    publicationName: string
    publicTables: string[]
    triggers?: TriggerDefinition[]
    seeds?: SeedDefinition[]
  }
}

export type MigrateOptions = {
  migrations: Record<string, () => Promise<unknown>>
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

  // use a caller-provided pool (e.g. the Cloudflare DO-backed pool) when given;
  // otherwise build the default real-pg pool from the connection string.
  const pool =
    config.pool ??
    createPool({
      connectionString: connectionString ?? '',
      ...config.poolOptions,
    })

  const drizzle = createDrizzle({
    pool,
    schema,
    relations: relations as TRelations & AnyRelations,
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
    if (!connectionString) {
      throw new Error(
        'createDatabase: migrate() requires a `connectionString` (it is not derivable from a pre-built `pool`)',
      )
    }
    console.info('[database] waiting for database to be ready...')
    await waitForDatabase(connectionString)

    console.info('[database] running migrations...')
    await migrate({
      connectionString,
      migrations: options.migrations,
      cvrDb: stripQueryParams(options.cvrDb),
      changeDb: stripQueryParams(options.changeDb),
      createDatabases: options.createDatabases,
      gitSha: options.gitSha,
      defaultTimeout: options.defaultTimeout,
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
