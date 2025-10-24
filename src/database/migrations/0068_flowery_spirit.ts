import type { PoolClient } from 'pg'
import sql from './0068_flowery_spirit.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
