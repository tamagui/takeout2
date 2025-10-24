import type { PoolClient } from 'pg'
import sql from './0135_serious_bloodaxe.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
