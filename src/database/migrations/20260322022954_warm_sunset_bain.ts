import type { PoolClient } from 'pg'

const sql = `ALTER TABLE "invite" DROP CONSTRAINT "invite_code_unique";`

export async function up(client: PoolClient) {
  await client.query(sql)
}
