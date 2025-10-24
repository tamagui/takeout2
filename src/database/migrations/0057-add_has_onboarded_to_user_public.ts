import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  await client.query(`
    ALTER TABLE "userPublic" 
    ADD COLUMN IF NOT EXISTS "hasOnboarded" BOOLEAN NOT NULL DEFAULT false
  `)
}
