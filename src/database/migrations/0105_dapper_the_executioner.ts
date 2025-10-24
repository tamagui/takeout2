import type { PoolClient } from 'pg'
import sql from './0105_dapper_the_executioner.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
