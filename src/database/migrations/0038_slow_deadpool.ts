import type { PoolClient } from 'pg'
import sql from './0038_slow_deadpool.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
