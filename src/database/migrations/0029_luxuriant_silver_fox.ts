import type { PoolClient } from 'pg'
import sql from './0029_luxuriant_silver_fox.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
