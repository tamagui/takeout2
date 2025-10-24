import type { PoolClient } from 'pg'
import sql from './0107_silent_lockheed.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
