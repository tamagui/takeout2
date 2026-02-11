import { Pool } from 'pg'

import { ZERO_UPSTREAM_DB } from '~/server/env-server'

if (!ZERO_UPSTREAM_DB) {
  console.warn(`[postgres] no database connection string found, skipping pool creation`)
}

export const database = ZERO_UPSTREAM_DB
  ? new Pool({
      connectionString: ZERO_UPSTREAM_DB,
      // handle self-signed certificates in production
      ssl: ZERO_UPSTREAM_DB.includes('sslmode=require')
        ? { rejectUnauthorized: false }
        : undefined,
    })
  : (null as unknown as Pool)

if (database) {
  database.on('error', (error) => {
    console.error(`[postgres] database error`, error)
  })
}

// cleanup function that can be called during shutdown
export async function closeDatabase() {
  if (!database) return
  try {
    await database.end()
  } catch (error) {
    console.error(`[postgres] error closing database:`, error)
  }
}
