CREATE INDEX "idx_appInstall_server" ON "appInstall" USING btree ("serverId");--> statement-breakpoint
CREATE INDEX "idx_channel_server_not_deleted" ON "channel" USING btree ("serverId","id") WHERE "channel"."deleted" != true;--> statement-breakpoint
CREATE INDEX "idx_channelTopic_server_created" ON "channelTopic" USING btree ("serverId","channelId","createdAt");