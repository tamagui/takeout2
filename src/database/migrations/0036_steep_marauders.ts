import type { PoolClient } from 'pg'
import sql from './0036_steep_marauders.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
