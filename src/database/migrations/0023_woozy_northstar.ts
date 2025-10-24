import type { PoolClient } from 'pg'
import sql from './0023_woozy_northstar.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
