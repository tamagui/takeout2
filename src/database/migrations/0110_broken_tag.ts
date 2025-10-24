import type { PoolClient } from 'pg'
import sql from './0110_broken_tag.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
