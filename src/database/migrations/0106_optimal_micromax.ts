import type { PoolClient } from 'pg'
import sql from './0106_optimal_micromax.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
