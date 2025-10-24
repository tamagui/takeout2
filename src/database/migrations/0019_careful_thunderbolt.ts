import type { PoolClient } from 'pg'
import sql from './0019_careful_thunderbolt.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
