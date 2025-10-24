import type { PoolClient } from 'pg'
import sql from './0040_neat_exiles.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
