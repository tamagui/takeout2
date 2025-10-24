import type { PoolClient } from 'pg'
import sql from './0026_thin_gravity.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
