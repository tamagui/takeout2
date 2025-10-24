ALTER TABLE "userState" ALTER COLUMN "userId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "userState" ADD COLUMN "apiKey" varchar;--> statement-breakpoint
ALTER TABLE "userState" ADD COLUMN "serversSort" jsonb;--> statement-breakpoint
ALTER TABLE "userState" ADD COLUMN "activeServer" varchar;--> statement-breakpoint
ALTER TABLE "userState" ADD COLUMN "lastPathname" varchar;--> statement-breakpoint
ALTER TABLE "userState" ADD COLUMN "lastActiveChannel" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "userState" ADD COLUMN "channelState" jsonb;--> statement-breakpoint
ALTER TABLE "userState" ADD COLUMN "threadState" jsonb;--> statement-breakpoint
ALTER TABLE "userState" ADD COLUMN "messageEdits" jsonb;--> statement-breakpoint
ALTER TABLE "userState" ADD COLUMN "topReactions" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "userState" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "userState" DROP COLUMN "value";
