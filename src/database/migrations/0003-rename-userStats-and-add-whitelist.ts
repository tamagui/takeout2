import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  // Rename userStats table to userProfile
  await client.query(`
    ALTER TABLE "userStats" RENAME TO "userProfile";
  `)

  // Create whitelist table
  await client.query(`
    CREATE TABLE IF NOT EXISTS "whitelist" (
      "id" text PRIMARY KEY NOT NULL,
      "email" varchar(200) NOT NULL UNIQUE,
      "createdAt" timestamp DEFAULT now()
    );
  `)
}
