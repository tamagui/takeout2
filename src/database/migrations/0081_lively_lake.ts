import type { PoolClient } from 'pg'
import sql from './0081_lively_lake.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
