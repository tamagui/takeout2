import type { PoolClient } from 'pg'
import sql from './0139_huge_nightmare.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
