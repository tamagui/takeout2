import type { PoolClient } from 'pg'

const sql = `CREATE INDEX "comment_postId_createdAt_idx" ON "comment" USING btree ("postId","createdAt");--> statement-breakpoint
CREATE INDEX "notification_userId_read_createdAt_idx" ON "notification" USING btree ("userId","read","createdAt");--> statement-breakpoint
CREATE INDEX "notification_actorId_idx" ON "notification" USING btree ("actorId");--> statement-breakpoint
CREATE INDEX "post_createdAt_id_desc_idx" ON "post" USING btree ("createdAt","id");--> statement-breakpoint
CREATE INDEX "userPublic_username_idx" ON "userPublic" USING btree ("username");`

export async function up(client: PoolClient) {
  await client.query(sql)
}
