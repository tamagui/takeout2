import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { drizzle } from 'drizzle-orm/node-postgres'
import type { Pool } from 'pg'
import pg from 'pg'

export const createPool = (connectionString: string): Pool => {
  return new pg.Pool({
    connectionString,
  })
}

export const createDb = <TSchema extends Record<string, unknown>>(
  connectionString: string,
  schema: TSchema
): NodePgDatabase<TSchema> => {
  const pool = createPool(connectionString)
  return drizzle(pool, {
    schema,
    logger: false,
  }) as NodePgDatabase<TSchema>
}

export type { NodePgDatabase }

// re-export for convenience
export { createSql, type SqlQuery } from './sql'

export { createServerHelpers, type ServerHelpers } from './createServerHelpers'

export {
  getDBClient,
  queryDb,
  type GetDBClientOptions,
} from './helpers/getDBClient'

export { processInChunks, updateInChunks } from './helpers/chunkedQuery'
