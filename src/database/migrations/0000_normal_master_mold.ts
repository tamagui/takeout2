import type { PoolClient } from 'pg'
import sql from './0000_normal_master_mold.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
