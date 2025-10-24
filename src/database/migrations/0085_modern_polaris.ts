import type { PoolClient } from 'pg'
import sql from './0085_modern_polaris.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
