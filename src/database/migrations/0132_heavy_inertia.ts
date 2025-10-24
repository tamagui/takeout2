import type { PoolClient } from 'pg'
import sql from './0132_heavy_inertia.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
