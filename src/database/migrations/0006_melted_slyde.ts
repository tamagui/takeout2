import type { PoolClient } from 'pg'
import sql from './0006_melted_slyde.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
