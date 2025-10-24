import type { PoolClient } from 'pg'
import sql from './0011_mute_stardust.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
