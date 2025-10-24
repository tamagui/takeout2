import type { PoolClient } from 'pg'
import sql from './0103_messy_nuke.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
