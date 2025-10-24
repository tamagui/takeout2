ALTER TABLE "plugin" ALTER COLUMN "creatorId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "plugin" ALTER COLUMN "uid" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "plugin" ALTER COLUMN "description" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "plugin" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "plugin" ADD COLUMN "version" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "plugin" ADD COLUMN "source" text NOT NULL;--> statement-breakpoint
ALTER TABLE "plugin" DROP COLUMN "type";