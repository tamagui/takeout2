import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  // add optional fromUserId column to notification table
  await client.query(`
    ALTER TABLE notification 
    ADD COLUMN IF NOT EXISTS "fromUserId" VARCHAR
  `)

  // delete notifications that don't have a valid message or message without creator
  await client.query(`
    DELETE FROM notification n
    WHERE NOT EXISTS (
      SELECT 1 FROM message m 
      WHERE m.id = n."messageId" 
      AND m."creatorId" IS NOT NULL
    )
  `)

  // populate fromUserId from message creator for remaining notifications
  await client.query(`
    UPDATE notification n
    SET "fromUserId" = m."creatorId"
    FROM message m
    WHERE n."messageId" = m.id
      AND m."creatorId" IS NOT NULL
      AND n."fromUserId" IS NULL
  `)
}
