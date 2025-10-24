DROP INDEX "idx_channel_server_id";--> statement-breakpoint
DROP INDEX "idx_channel_deleted";--> statement-breakpoint
CREATE INDEX "idx_channel_id_server" ON "channel" USING btree ("id","serverId");--> statement-breakpoint
CREATE INDEX "idx_channel_server" ON "channel" USING btree ("serverId","deleted");--> statement-breakpoint
CREATE INDEX "idx_server_id" ON "server" USING btree ("id");--> statement-breakpoint
CREATE INDEX "idx_server_private" ON "server" USING btree ("isPrivateChat");