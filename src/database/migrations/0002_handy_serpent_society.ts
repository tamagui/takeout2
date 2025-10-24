import type { PoolClient } from 'pg'
import sql from './0002_handy_serpent_society.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
