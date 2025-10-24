import type { PoolClient } from 'pg'
import sql from './0134_tan_maggott.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
