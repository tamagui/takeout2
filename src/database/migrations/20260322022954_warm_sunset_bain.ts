import type { PoolClient } from 'pg'

const sql = `ALTER TABLE "invite" DROP CONSTRAINT "invite_code_unique";`

export async function up(client: PoolClient) {
  for (const stmt of sql.split('--> statement-breakpoint')) {
    const trimmed = stmt.trim()
    if (trimmed) await client.query(trimmed)
  }
}
