DROP INDEX "idx_message_thread";--> statement-breakpoint
DROP INDEX "idx_message_creator";--> statement-breakpoint
DROP INDEX "idx_message_server";--> statement-breakpoint
CREATE INDEX "idx_message_thread" ON "message" USING btree ("threadId","deleted","order","type");--> statement-breakpoint
CREATE INDEX "idx_message_creator" ON "message" USING btree ("creatorId","channelId","deleted","order","type");--> statement-breakpoint
CREATE INDEX "idx_message_server" ON "message" USING btree ("serverId","channelId","deleted","order","type");