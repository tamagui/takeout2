import type { PoolClient } from 'pg'
import sql from './0018_amused_jazinda.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
