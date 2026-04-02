import { type NodePgDatabase, drizzle } from 'drizzle-orm/node-postgres'

import { createPool } from './createPool'

export const createDb = <TSchema extends Record<string, unknown>>(
  connectionString: string,
  schema: TSchema,
): NodePgDatabase<TSchema> => {
  const pool = createPool({ connectionString })
  return drizzle({
    client: pool,
    schema: schema as Record<string, unknown>,
    logger: false,
  } as any) as unknown as NodePgDatabase<TSchema>
}
