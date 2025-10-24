import type { PoolClient } from 'pg'
import sql from './0045_superb_ronan.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
