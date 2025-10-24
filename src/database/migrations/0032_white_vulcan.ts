import type { PoolClient } from 'pg'
import sql from './0032_white_vulcan.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
