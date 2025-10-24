ALTER TABLE "notification" ALTER COLUMN "messageId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "notification" ALTER COLUMN "channelId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "notification" ALTER COLUMN "serverId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "notification" ADD COLUMN "type" varchar;