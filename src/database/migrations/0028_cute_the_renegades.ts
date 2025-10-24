import type { PoolClient } from 'pg'
import sql from './0028_cute_the_renegades.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
