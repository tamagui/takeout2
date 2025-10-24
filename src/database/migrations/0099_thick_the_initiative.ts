import type { PoolClient } from 'pg'
import sql from './0099_thick_the_initiative.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
