import type { PoolClient } from 'pg'
import sql from './0020b_fix_orphaned_threads.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
