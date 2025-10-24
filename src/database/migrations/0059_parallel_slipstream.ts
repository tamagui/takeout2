import type { PoolClient } from 'pg'
import sql from './0059_parallel_slipstream.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
