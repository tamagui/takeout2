import type { PoolClient } from 'pg'
import sql from './0047_legal_silver_samurai.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
