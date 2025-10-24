import type { PoolClient } from 'pg'
import sql from './0057_puzzling_masked_marvel.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
