import type { PoolClient } from 'pg'
import sql from './0007_hard_vivisector.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
