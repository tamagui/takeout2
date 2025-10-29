import type { PoolClient } from 'pg'
import sql from './0002_futuristic_screwball.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
