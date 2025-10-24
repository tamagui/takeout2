ALTER TABLE "user" ADD COLUMN "normalizedEmail" varchar(200);--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_normalizedEmail_unique" UNIQUE("normalizedEmail");