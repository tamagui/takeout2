import { Pool } from 'pg'
import { ZERO_UPSTREAM_DB } from '~/server/env-server'

if (!ZERO_UPSTREAM_DB) {
  throw new Error(`No db string connection found`)
}

export const database = new Pool({
  connectionString: ZERO_UPSTREAM_DB,
})

database.on('error', (error) => {
  console.error(`[postgres] database error`, error)
})

// cleanup function that can be called during shutdown
export async function closeDatabase() {
  try {
    await database.end()
  } catch (error) {
    console.error(`[postgres] error closing database:`, error)
  }
}
