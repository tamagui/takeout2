CREATE INDEX "idx_channelActive_channel_user" ON "channelActive" USING btree ("channelId","userId");--> statement-breakpoint
CREATE INDEX "idx_channelTopic_created" ON "channelTopic" USING btree ("channelId","createdAt");--> statement-breakpoint
CREATE INDEX "idx_meeting_channel_active" ON "meeting" USING btree ("channelId","id") WHERE "active" = true;--> statement-breakpoint
CREATE INDEX "idx_notification_user_unseen" ON "notification" USING btree ("userId","channelId") WHERE "seenAt" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_serverMember_server_user" ON "serverMember" USING btree ("serverId","userId");