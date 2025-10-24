import type { PoolClient } from 'pg'
import sql from './0025_loving_tomas.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
