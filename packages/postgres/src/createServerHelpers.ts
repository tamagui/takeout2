import { getDBClient, type GetDBClientOptions } from './getDBClient'
import { createSql, setDefaultPool } from './sql'

import type { Pool } from 'pg'

export type ServerHelpers = {
  sql: ReturnType<typeof createSql>
  getDBClient: (
    options?: Omit<GetDBClientOptions, 'pool' | 'connectionString'>
  ) => ReturnType<typeof getDBClient>
}

export function createServerHelpers(pool: Pool): ServerHelpers {
  const sql = createSql(pool)
  setDefaultPool(pool)

  return {
    sql,
    getDBClient: (options = {}) => getDBClient({ pool, ...options }),
  }
}
