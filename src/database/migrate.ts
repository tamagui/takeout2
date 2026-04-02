import { getDBClient } from '@take-out/postgres/getDBClient'
import { migrate } from '@take-out/postgres/migrate'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import * as schemaPrivate from './schema-private'
import { PgTable } from 'drizzle-orm/pg-core'
import { getTableName } from 'drizzle-orm'

const ZERO_UPSTREAM_DB = process.env['ZERO_UPSTREAM_DB'] || ''
const ZERO_CVR_DB = process.env['ZERO_CVR_DB'] || ''
const ZERO_CHANGE_DB = process.env['ZERO_CHANGE_DB'] || ''

// vite tries to eval this at build time :/
const PROCESS_ENV = globalThis['process']['env']

// build migrations glob compatible with @take-out/postgres/migrate
// replaces import.meta.glob which is vite-only
const migrationsDir = join(import.meta.dirname, 'migrations')
const migrationsTS: Record<string, () => Promise<unknown>> = {}
for (const file of readdirSync(migrationsDir).filter((f) => f.endsWith('.ts'))) {
  const path = `./migrations/${file}`
  migrationsTS[path] = () => import(join(migrationsDir, file))
}
console.info('[migrate] found migrations:', Object.keys(migrationsTS).length)

// derive private table names from schema-private.ts - no manual list to maintain
const PRIVATE_TABLES = Object.values(schemaPrivate)
  .filter((v) => v instanceof PgTable)
  .map((t) => getTableName(t))

async function ensureZeroPublication() {
  const client = await getDBClient({ connectionString: ZERO_UPSTREAM_DB })
  try {
    // find tables that should be in the publication
    const { rows: wanted } = await client.query(
      `SELECT tablename FROM pg_tables
       WHERE schemaname = 'public'
         AND tablename != ALL($1)
         AND tablename NOT LIKE '_zero_%'`,
      [PRIVATE_TABLES],
    )
    const wantedSet = new Set(wanted.map((r: any) => r.tablename))

    if (!wantedSet.size) {
      console.info(`[migrate] no public tables found for zero_takeout publication`)
      return
    }

    const { rows: pub } = await client.query(
      `SELECT 1 FROM pg_publication WHERE pubname = 'zero_takeout'`,
    )

    if (!pub.length) {
      // create publication with all wanted tables
      // note: requires wal_level=logical which is set in docker-compose postgres config.
      // pglite (local dev) may fail here - zero creates the empty publication on startup
      // in that case, so the next deploy/migration will populate it.
      try {
        const tableList = [...wantedSet].map((t) => `"${t}"`).join(', ')
        await client.query(`CREATE PUBLICATION zero_takeout FOR TABLE ${tableList}`)
        console.info(
          `[migrate] created publication zero_takeout with ${wantedSet.size} tables`,
        )
      } catch (e: any) {
        // 42710 = publication already exists (race with zero startup)
        if (e.code === '42710') {
          console.info(
            `[migrate] zero_takeout publication was created concurrently, will sync`,
          )
        } else {
          console.warn(
            `[migrate] could not create zero_takeout publication: ${e.message}`,
          )
          return
        }
      }
    }

    // find tables currently in the publication
    const { rows: current } = await client.query(
      `SELECT tablename FROM pg_publication_tables
       WHERE pubname = 'zero_takeout' AND schemaname = 'public'`,
    )
    const currentSet = new Set(current.map((r: any) => r.tablename))

    // remove tables that shouldn't be there
    const toRemove = [...currentSet].filter((t) => !wantedSet.has(t))
    if (toRemove.length) {
      const dropList = toRemove.map((t) => `"${t}"`).join(', ')
      await client.query(`ALTER PUBLICATION zero_takeout DROP TABLE ${dropList}`)
      console.info(`[migrate] removed from zero_takeout: ${dropList}`)
    }

    // add missing tables one at a time - pg may have stale view of publication_tables
    const toAdd = [...wantedSet].filter((t) => !currentSet.has(t))
    const added: string[] = []
    for (const table of toAdd) {
      try {
        await client.query(`ALTER PUBLICATION zero_takeout ADD TABLE "${table}"`)
        added.push(table)
      } catch (e: any) {
        // 42710 = already member of publication
        if (e.code !== '42710') throw e
      }
    }

    if (added.length) {
      console.info(
        `[migrate] added to zero_takeout: ${added.map((t) => `"${t}"`).join(', ')}`,
      )
    }

    if (!toRemove.length && !added.length) {
      console.info(
        `[migrate] zero_takeout publication is up to date (${currentSet.size} tables)`,
      )
    }
  } finally {
    client.release()
  }
}

function stripQueryParams(connStr: string | undefined): string | undefined {
  if (!connStr) return connStr
  return connStr.split('?')[0]
}

export async function main() {
  console.info('🔄 waiting for database to be ready...')
  await waitForDatabase(ZERO_UPSTREAM_DB!)

  console.info('🚀 running migrations...')
  await migrate({
    connectionString: ZERO_UPSTREAM_DB!,
    migrationsGlob: migrationsTS,
    cvrDb: stripQueryParams(ZERO_CVR_DB),
    changeDb: stripQueryParams(ZERO_CHANGE_DB),
    gitSha: process.env.GIT_SHA,
    onMigrationComplete: async () => {
      await ensureZeroPublication()
    },
  })
  console.info('✅ migrations complete')
}

if (PROCESS_ENV.RUN) {
  main().catch((err: unknown) => {
    console.error('Migration failed:', err)
    process.exit(1)
  })
}

async function waitForDatabase(connectionString: string, maxRetries = 30) {
  const { Pool } = await import('pg')

  for (let i = 0; i < maxRetries; i++) {
    try {
      const pool = new Pool({
        connectionString,
        ssl: connectionString.includes('sslmode=require')
          ? { rejectUnauthorized: false }
          : undefined,
      })
      await pool.query('SELECT 1')
      await pool.end()
      console.info('✅ database connection successful')
      return
    } catch (err) {
      const delay = Math.min(1000 * 1.5 ** i, 10000)
      console.info(
        `⏳ waiting for database... attempt ${i + 1}/${maxRetries} (retry in ${delay}ms)`,
      )
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
  throw new Error('database connection timeout after ' + maxRetries + ' attempts')
}
