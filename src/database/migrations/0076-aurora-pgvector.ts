import type { PoolClient } from 'pg'
import sql from './0076-aurora-pgvector.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
