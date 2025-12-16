import sql from './0002_add_comments.sql?raw'

import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  await client.query(sql)
}
