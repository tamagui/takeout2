ALTER TABLE "attachment" ADD COLUMN "name" varchar DEFAULT '';--> statement-breakpoint
ALTER TABLE "attachment" ADD COLUMN "draft" boolean;--> statement-breakpoint
ALTER TABLE "attachment" ADD COLUMN "uploadPercent" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "attachment" ADD COLUMN "error" varchar;