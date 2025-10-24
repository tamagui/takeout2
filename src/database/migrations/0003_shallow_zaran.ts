import type { PoolClient } from 'pg'
import sql from './0003_shallow_zaran.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
