import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  await client.query(`ALTER TABLE "appInstall" ALTER COLUMN "threadId" DROP NOT NULL`)
}
