import type { PoolClient } from 'pg'
import sql from './0004_brainy_nitro.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
