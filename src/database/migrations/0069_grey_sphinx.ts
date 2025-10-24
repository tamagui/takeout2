import type { PoolClient } from 'pg'
import sql from './0069_grey_sphinx.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
