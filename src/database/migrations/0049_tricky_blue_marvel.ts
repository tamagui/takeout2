import type { PoolClient } from 'pg'
import sql from './0049_tricky_blue_marvel.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
