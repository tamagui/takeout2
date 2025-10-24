CREATE INDEX "idx_messageReaction_creator" ON "messageReaction" USING btree ("creatorId","messageId","reactionId");--> statement-breakpoint
CREATE INDEX "idx_messageReaction_message" ON "messageReaction" USING btree ("messageId","creatorId");--> statement-breakpoint
CREATE INDEX "idx_messageReaction_channel" ON "messageReaction" USING btree ("channelId","creatorId");