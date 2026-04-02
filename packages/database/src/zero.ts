import { basename } from 'node:path'

import { getTableName } from 'drizzle-orm'
import { PgTable } from 'drizzle-orm/pg-core'

import { getDBClient } from './getDBClient'

import type { PoolClient } from 'pg'

// --- zero publication management ---

export type ZeroPublicationOptions = {
  connectionString: string
  /** zero publication name, e.g. 'zero_takeout' or 'zero_chat' */
  publicationName: string
  /** table names excluded from publication (private/auth tables) */
  privateTableNames: string[]
}

export async function ensureZeroPublication(options: ZeroPublicationOptions) {
  const { connectionString, publicationName, privateTableNames } = options
  const client = await getDBClient({ connectionString })

  try {
    const { rows: wanted } = await client.query(
      `SELECT tablename FROM pg_tables
       WHERE schemaname = 'public'
         AND tablename != ALL($1)
         AND tablename NOT LIKE '_zero_%'
         AND tablename != 'migrations'`,
      [privateTableNames],
    )
    const wantedSet = new Set(wanted.map((r: any) => r.tablename))

    if (!wantedSet.size) {
      console.info(`[zero] no public tables found for ${publicationName} publication`)
      return
    }

    const { rows: pub } = await client.query(
      `SELECT 1 FROM pg_publication WHERE pubname = $1`,
      [publicationName],
    )

    if (!pub.length) {
      try {
        const tableList = [...wantedSet].map((t) => `"${t}"`).join(', ')
        await client.query(`CREATE PUBLICATION ${publicationName} FOR TABLE ${tableList}`)
        console.info(
          `[zero] created publication ${publicationName} with ${wantedSet.size} tables`,
        )
      } catch (e: any) {
        if (e.code === '42710') {
          console.info(
            `[zero] ${publicationName} publication was created concurrently, will sync`,
          )
        } else {
          console.warn(
            `[zero] could not create ${publicationName} publication: ${e.message}`,
          )
          return
        }
      }
    }

    const { rows: current } = await client.query(
      `SELECT tablename FROM pg_publication_tables
       WHERE pubname = $1 AND schemaname = 'public'`,
      [publicationName],
    )
    const currentSet = new Set(current.map((r: any) => r.tablename))

    const toRemove = [...currentSet].filter((t) => !wantedSet.has(t))
    if (toRemove.length) {
      const dropList = toRemove.map((t) => `"${t}"`).join(', ')
      await client.query(`ALTER PUBLICATION ${publicationName} DROP TABLE ${dropList}`)
      console.info(`[zero] removed from ${publicationName}: ${dropList}`)
    }

    const toAdd = [...wantedSet].filter((t) => !currentSet.has(t))
    const added: string[] = []
    for (const table of toAdd) {
      try {
        await client.query(`ALTER PUBLICATION ${publicationName} ADD TABLE "${table}"`)
        added.push(table)
      } catch (e: any) {
        if (e.code !== '42710') throw e
      }
    }

    if (added.length) {
      console.info(
        `[zero] added to ${publicationName}: ${added.map((t) => `"${t}"`).join(', ')}`,
      )
    }

    if (!toRemove.length && !added.length) {
      console.info(
        `[zero] ${publicationName} publication is up to date (${currentSet.size} tables)`,
      )
    }
  } finally {
    client.release()
  }
}

// --- zero database creation ---

export type ZeroDatabaseOptions = {
  connectionString: string
  cvrDb?: string
  changeDb?: string
}

export async function ensureZeroDatabases(options: ZeroDatabaseOptions) {
  const { connectionString, cvrDb, changeDb } = options
  if (!cvrDb && !changeDb) return

  const client = await getDBClient({ connectionString })

  try {
    const dbNames = [basename(cvrDb || ''), basename(changeDb || '')].filter(Boolean)

    for (const name of dbNames) {
      const { rows } = await client.query(
        `SELECT 1 FROM pg_database WHERE datname = '${name}'`,
      )
      if (!rows.length) {
        await client.query(`CREATE DATABASE ${name};`)
        console.info(`[zero] created database ${name}`)
      }
    }
  } finally {
    client.release()
  }
}

// --- zero triggers ---

export type TriggerDefinition = {
  name: string
  sql: string
}

export function defineTrigger(name: string, sql: string): TriggerDefinition {
  return { name, sql }
}

/** load trigger definitions from a glob result (import.meta.glob or loadTriggersFromDir) */
export async function loadTriggers(
  glob: Record<string, () => Promise<unknown>>,
): Promise<TriggerDefinition[]> {
  const triggers: TriggerDefinition[] = []
  for (const [path, load] of Object.entries(glob).sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    const mod = (await load()) as {
      default?: TriggerDefinition
      name?: string
      sql?: string
    }
    if (mod.default) {
      triggers.push(mod.default)
    } else if (mod.sql) {
      triggers.push({ name: mod.name || basename(path, '.ts'), sql: mod.sql })
    }
  }
  return triggers
}

export async function ensureZeroTriggers(
  client: PoolClient,
  triggers: TriggerDefinition[],
) {
  for (const trigger of triggers) {
    try {
      await client.query(trigger.sql)
    } catch (err) {
      console.error(`[zero] failed to apply trigger ${trigger.name}:`, err)
      throw err
    }
  }
  console.info(`[zero] applied ${triggers.length} trigger definitions`)
}

// --- zero seeds ---

export type SeedDefinition = {
  name: string
  sql: string
}

export function defineSeed(name: string, sql: string): SeedDefinition {
  return { name, sql }
}

export async function loadSeeds(
  glob: Record<string, () => Promise<unknown>>,
): Promise<SeedDefinition[]> {
  const seeds: SeedDefinition[] = []
  for (const [path, load] of Object.entries(glob).sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    const mod = (await load()) as {
      default?: SeedDefinition
      name?: string
      sql?: string
    }
    if (mod.default) {
      seeds.push(mod.default)
    } else if (mod.sql) {
      seeds.push({ name: mod.name || basename(path, '.ts'), sql: mod.sql })
    }
  }
  return seeds
}

export async function ensureZeroSeeds(client: PoolClient, seeds: SeedDefinition[]) {
  for (const seed of seeds) {
    try {
      await client.query(seed.sql)
    } catch (err) {
      console.error(`[zero] failed to apply seed ${seed.name}:`, err)
      throw err
    }
  }
  console.info(`[zero] applied ${seeds.length} seed definitions`)
}

// --- init sql for pglite/browser ---
// todo: drizzleSchemaToSQL(schema) → string for browser pglite init (currently ddl is passed as string)

export type InitSqlOptions = {
  /** DDL statements (CREATE TABLE, etc.) */
  ddl?: string
  triggers?: TriggerDefinition[]
  seeds?: SeedDefinition[]
}

export function buildInitSql(options: InitSqlOptions): string {
  const parts: string[] = []

  if (options.ddl) {
    parts.push(options.ddl)
  }

  if (options.triggers?.length) {
    parts.push(...options.triggers.map((t) => `-- trigger: ${t.name}\n${t.sql}`))
  }

  if (options.seeds?.length) {
    parts.push(...options.seeds.map((s) => `-- seed: ${s.name}\n${s.sql}`))
  }

  return parts.join('\n\n')
}

// --- schema helpers ---

const PRIVATE = Symbol.for('take-out/database/private')

/** wrap pgTable to mark tables as private (excluded from zero replication) */
export function privateTable<T extends (...args: any[]) => any>(createTable: T): T {
  return ((...args: any[]) => {
    const table = createTable(...args)
    ;(table as any)[PRIVATE] = true
    return table
  }) as unknown as T
}

/** check if a table is marked as private */
export function isPrivateTable(table: unknown): boolean {
  return !!(table && typeof table === 'object' && PRIVATE in table)
}

/** derive public table names from a schema (all tables not marked private) */
export function derivePublicTables(schema: Record<string, unknown>): string[] {
  return Object.values(schema)
    .filter((v) => v instanceof PgTable && !isPrivateTable(v))
    .map((t) => getTableName(t as PgTable))
}
