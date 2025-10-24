import type { PoolClient } from 'pg'
import sql from './0090_long_prism.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
