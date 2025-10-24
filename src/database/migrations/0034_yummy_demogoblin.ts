import type { PoolClient } from 'pg'
import sql from './0034_yummy_demogoblin.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
