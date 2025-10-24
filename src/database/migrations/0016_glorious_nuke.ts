import type { PoolClient } from 'pg'
import sql from './0016_glorious_nuke.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
