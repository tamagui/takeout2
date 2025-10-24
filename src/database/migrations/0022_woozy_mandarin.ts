import type { PoolClient } from 'pg'
import sql from './0022_woozy_mandarin.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
