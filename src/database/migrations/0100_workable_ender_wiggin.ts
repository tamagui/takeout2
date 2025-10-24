import type { PoolClient } from 'pg'
import sql from './0100_workable_ender_wiggin.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
