import type { PoolClient } from 'pg'
import sql from './0066_first_zzzax.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
