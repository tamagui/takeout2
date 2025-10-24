ALTER TABLE "serverApp" ALTER COLUMN "serverId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "serverApp" ALTER COLUMN "creatorId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "serverApp" ALTER COLUMN "appId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "serverApp" ADD COLUMN "channelId" varchar;--> statement-breakpoint
ALTER TABLE "serverApp" ADD CONSTRAINT "serverApp_channelId_channel_id_fk" FOREIGN KEY ("channelId") REFERENCES "public"."channel"("id") ON DELETE cascade ON UPDATE no action;