import type { PoolClient } from 'pg'
import sql from './0039_bumpy_epoch.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
