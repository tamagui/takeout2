import type { PoolClient } from 'pg'
import sql from './0001_wakeful_nightshade.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
