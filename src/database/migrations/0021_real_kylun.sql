ALTER TABLE "attachment" DROP CONSTRAINT "attachment_channelId_channel_id_fk";
--> statement-breakpoint
ALTER TABLE "message" DROP CONSTRAINT "message_creatorId_userPublic_id_fk";
--> statement-breakpoint
ALTER TABLE "messageReaction" DROP CONSTRAINT "messageReaction_channelId_channel_id_fk";
--> statement-breakpoint
ALTER TABLE "pin" DROP CONSTRAINT "pin_creatorId_userPublic_id_fk";
--> statement-breakpoint
ALTER TABLE "role" DROP CONSTRAINT "role_creatorId_userPublic_id_fk";
--> statement-breakpoint
ALTER TABLE "server" DROP CONSTRAINT "server_creatorId_userPublic_id_fk";
--> statement-breakpoint
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_channelId_channel_id_fk" FOREIGN KEY ("channelId") REFERENCES "public"."channel"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_replyingToId_message_id_fk" FOREIGN KEY ("replyingToId") REFERENCES "public"."message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_creatorId_userPublic_id_fk" FOREIGN KEY ("creatorId") REFERENCES "public"."userPublic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messageReaction" ADD CONSTRAINT "messageReaction_channelId_channel_id_fk" FOREIGN KEY ("channelId") REFERENCES "public"."channel"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pin" ADD CONSTRAINT "pin_creatorId_userPublic_id_fk" FOREIGN KEY ("creatorId") REFERENCES "public"."userPublic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role" ADD CONSTRAINT "role_creatorId_userPublic_id_fk" FOREIGN KEY ("creatorId") REFERENCES "public"."userPublic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server" ADD CONSTRAINT "server_creatorId_userPublic_id_fk" FOREIGN KEY ("creatorId") REFERENCES "public"."userPublic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread" ADD CONSTRAINT "thread_messageId_message_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."message"("id") ON DELETE cascade ON UPDATE no action;