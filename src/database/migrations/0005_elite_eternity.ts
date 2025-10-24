import type { PoolClient } from 'pg'
import sql from './0005_elite_eternity.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
