ALTER TABLE "task" ADD COLUMN "threadId" varchar;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "channelId" varchar;--> statement-breakpoint
ALTER TABLE "task" DROP COLUMN "complete";