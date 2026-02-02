import sql from './0001_initial_schema.sql?raw'

import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  const statements = sql.split('--> statement-breakpoint')
  for (const statement of statements) {
    const trimmed = statement.trim()
    if (trimmed) {
      await client.query(trimmed)
    }
  }
}
