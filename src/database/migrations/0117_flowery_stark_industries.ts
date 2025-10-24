import type { PoolClient } from 'pg'
import sql from './0117_flowery_stark_industries.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
