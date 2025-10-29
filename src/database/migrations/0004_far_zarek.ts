import type { PoolClient } from 'pg'
import sql from './0004_far_zarek.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
