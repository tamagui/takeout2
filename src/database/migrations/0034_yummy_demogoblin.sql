CREATE INDEX "idx_channel_server_id" ON "channel" USING btree ("serverId","id");--> statement-breakpoint
CREATE INDEX "idx_channel_deleted" ON "channel" USING btree ("deleted");--> statement-breakpoint
CREATE INDEX "idx_channel_creator" ON "channel" USING btree ("creatorId","serverId");--> statement-breakpoint
CREATE INDEX "idx_server_creator" ON "server" USING btree ("creatorId");--> statement-breakpoint
CREATE INDEX "idx_server_domain" ON "server" USING btree ("domain");