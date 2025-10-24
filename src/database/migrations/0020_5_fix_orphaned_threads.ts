import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  await client.query(`
    UPDATE "thread" 
    SET "messageId" = NULL 
    WHERE "messageId" IS NOT NULL 
      AND "messageId" NOT IN (SELECT "id" FROM "message")
  `)
}
