import type { PoolClient } from 'pg'
import sql from './0093_short_thunderbolt.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
