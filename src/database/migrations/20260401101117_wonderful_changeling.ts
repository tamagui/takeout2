import type { PoolClient } from 'pg'

const sql = `ALTER TABLE "block" ALTER COLUMN "createdAt" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "comment" ALTER COLUMN "createdAt" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "device" ALTER COLUMN "createdAt" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "invite" ALTER COLUMN "createdAt" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "notification" ALTER COLUMN "createdAt" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "post" ALTER COLUMN "createdAt" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "report" ALTER COLUMN "createdAt" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "userPublic" ALTER COLUMN "joinedAt" DROP DEFAULT;`

export async function up(client: PoolClient) {
  for (const stmt of sql.split('--> statement-breakpoint')) {
    const trimmed = stmt.trim()
    if (trimmed) await client.query(trimmed)
  }
}
