import type { PoolClient } from 'pg'
import sql from './0050_sour_tarot.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
