import type { PoolClient } from 'pg'
import sql from './0070_wooden_onslaught.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
