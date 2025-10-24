import type { PoolClient } from 'pg'
import sql from './0030_nosy_nova.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
