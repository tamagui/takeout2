import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  // delete any remaining notifications with null fromUserId (safety check)
  await client.query(`
    DELETE FROM notification 
    WHERE "fromUserId" IS NULL
  `)

  // make fromUserId column required
  await client.query(`
    ALTER TABLE notification 
    ALTER COLUMN "fromUserId" SET NOT NULL
  `)
}
