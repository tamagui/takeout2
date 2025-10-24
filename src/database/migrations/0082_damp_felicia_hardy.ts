import type { PoolClient } from 'pg'
import sql from './0082_damp_felicia_hardy.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
