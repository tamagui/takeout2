import type { PoolClient } from 'pg'
import sql from './0116_brief_may_parker.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
