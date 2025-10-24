import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  await client.query(`
    ALTER TABLE "userPublic" 
    ADD COLUMN IF NOT EXISTS "migrationVersion" integer NOT NULL DEFAULT 0;
  `)
}
