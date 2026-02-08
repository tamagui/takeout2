import { type NodePgDatabase, drizzle } from 'drizzle-orm/node-postgres'

import { createPool } from './createPool'

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
