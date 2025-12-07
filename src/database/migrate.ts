import { migrate } from '@take-out/postgres/migrate'

import { ZERO_CHANGE_DB, ZERO_CVR_DB, ZERO_UPSTREAM_DB } from '~/server/env-server'

const migrationsTS = import.meta.glob(`./migrations/*.ts`)

// vite tries to eval this at build time :/
const PROCESS_ENV = globalThis['process']['env']

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
  })
  console.info('✅ migrations complete')
}

if (PROCESS_ENV.RUN) {
  main().catch((err) => {
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
        `⏳ waiting for database... attempt ${i + 1}/${maxRetries} (retry in ${delay}ms)`
      )
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
  throw new Error('database connection timeout after ' + maxRetries + ' attempts')
}
