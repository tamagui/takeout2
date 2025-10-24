import type { PoolClient } from 'pg'
import sql from './0130_noisy_sersi.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
