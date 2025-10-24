import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  // Recalculate all thread reply counts to ensure they exclude the original message
  await client.query(`
    UPDATE "thread" t
    SET "replyCount" = LEAST(
      (SELECT COUNT(*)::INTEGER
       FROM "message" m
       WHERE m."threadId" = t."id"
       AND m."deleted" = false
       AND m."id" != t."messageId"),
      11
    );
  `)
}
