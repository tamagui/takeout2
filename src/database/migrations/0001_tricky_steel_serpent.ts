import sql from './0001_tricky_steel_serpent.sql?raw'

import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  await client.query(sql)
}
