import type { PoolClient } from 'pg'
import sql from './0031_neat_nico_minoru.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
