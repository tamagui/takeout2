import type { PoolClient } from 'pg'
import sql from './0024_uneven_stardust.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
