import type { PoolClient } from 'pg'
import sql from './0010_warm_cerebro.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
