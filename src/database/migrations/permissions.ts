import type { PoolClient } from 'pg'
import sql from './permissions.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
