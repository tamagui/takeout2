import type { PoolClient } from 'pg'
import sql from './0054_harsh_mister_fear.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
