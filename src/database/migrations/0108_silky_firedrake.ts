import type { PoolClient } from 'pg'
import sql from './0108_silky_firedrake.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
