import type { PoolClient } from 'pg'
import sql from './0056_moaning_captain_flint.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
