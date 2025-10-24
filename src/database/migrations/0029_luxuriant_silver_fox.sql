ALTER TABLE "channel" ADD COLUMN "oldestMessageId" varchar;--> statement-breakpoint
ALTER TABLE "channel" ADD COLUMN "creatorId" varchar;--> statement-breakpoint
ALTER TABLE "channel" ADD CONSTRAINT "channel_creatorId_userPublic_id_fk" FOREIGN KEY ("creatorId") REFERENCES "public"."userPublic"("id") ON DELETE cascade ON UPDATE no action;