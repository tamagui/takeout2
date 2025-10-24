import type { PoolClient } from 'pg'
import sql from './0063_high_alice.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
