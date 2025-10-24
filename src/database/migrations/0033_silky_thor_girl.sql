CREATE INDEX "idx_message_channel_filtered" ON "message" USING btree ("channelId","deleted","isThreadReply","type","order");--> statement-breakpoint
CREATE INDEX "idx_message_thread" ON "message" USING btree ("threadId","deleted","order");--> statement-breakpoint
CREATE INDEX "idx_message_creator" ON "message" USING btree ("creatorId","channelId","deleted","order");--> statement-breakpoint
CREATE INDEX "idx_message_server" ON "message" USING btree ("serverId","channelId","deleted","order");