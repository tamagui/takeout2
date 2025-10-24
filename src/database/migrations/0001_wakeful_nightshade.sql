ALTER TABLE "message" ALTER COLUMN "serverId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "message" ALTER COLUMN "channelId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "thread" ALTER COLUMN "description" SET DEFAULT '';