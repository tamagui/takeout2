import type { PoolClient } from 'pg'
import sql from './0033_silky_thor_girl.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
