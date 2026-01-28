import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  await client.query(`
    ALTER TABLE "post"
    ADD COLUMN IF NOT EXISTS "imageWidth" integer,
    ADD COLUMN IF NOT EXISTS "imageHeight" integer;
  `)
}
