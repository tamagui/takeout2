import type { PoolClient } from 'pg'
import sql from './0104_known_boomerang.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
