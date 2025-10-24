import type { PoolClient } from 'pg'
import sql from './0087_remarkable_snowbird.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
