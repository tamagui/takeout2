import type { PoolClient } from 'pg'
import sql from './0112_hot_kang.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
