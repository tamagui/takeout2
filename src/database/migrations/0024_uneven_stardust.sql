ALTER TABLE "data" RENAME COLUMN "content" TO "value";--> statement-breakpoint
ALTER TABLE "data" ALTER COLUMN "channelId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "data" ALTER COLUMN "title" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "data" ADD COLUMN "key" varchar NOT NULL;