import type { PoolClient } from 'pg'
import sql from './0115_fearless_mathemanic.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
