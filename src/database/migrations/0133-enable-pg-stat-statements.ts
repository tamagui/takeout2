import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  await client.query('CREATE EXTENSION IF NOT EXISTS pg_stat_statements;')
}
