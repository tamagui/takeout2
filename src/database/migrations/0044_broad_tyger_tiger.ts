import type { PoolClient } from 'pg'
import sql from './0044_broad_tyger_tiger.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
