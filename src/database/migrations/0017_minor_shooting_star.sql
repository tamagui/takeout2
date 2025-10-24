ALTER TABLE "app" ADD COLUMN "options" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "optionsDefaults" jsonb DEFAULT '{}'::jsonb;