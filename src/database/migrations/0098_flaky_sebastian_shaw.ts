import type { PoolClient } from 'pg'
import sql from './0098_flaky_sebastian_shaw.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
