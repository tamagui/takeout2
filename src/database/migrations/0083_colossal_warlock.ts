import type { PoolClient } from 'pg'
import sql from './0083_colossal_warlock.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
