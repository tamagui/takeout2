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

process.on('exit', async () => {
  await database.end()
})
