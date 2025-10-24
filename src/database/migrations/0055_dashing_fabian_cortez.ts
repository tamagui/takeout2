import type { PoolClient } from 'pg'
import sql from './0055_dashing_fabian_cortez.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
