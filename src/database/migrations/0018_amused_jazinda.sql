ALTER TABLE "app" ADD COLUMN "meta" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "app" DROP COLUMN "options";--> statement-breakpoint
ALTER TABLE "app" DROP COLUMN "optionsDefaults";