import type { PoolClient } from 'pg'
import sql from './0015_hard_titanium_man.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
