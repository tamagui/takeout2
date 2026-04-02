import { type NodePgDatabase, drizzle } from 'drizzle-orm/node-postgres'

import { createPool } from './createPool'

export const createDb = <TSchema extends Record<string, unknown>>(
  connectionString: string,
  schema: TSchema,
): NodePgDatabase<TSchema> => {
  const pool = createPool({ connectionString })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return drizzle(pool as any, {
    schema,
    logger: false,
  }) as unknown as NodePgDatabase<TSchema>
}
