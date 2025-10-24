import type { PoolClient } from 'pg'
import sql from './0062_last_captain_stacy.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
