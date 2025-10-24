import type { PoolClient } from 'pg'
import sql from './0113_happy_james_howlett.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
