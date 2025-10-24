ALTER TABLE "task" RENAME COLUMN "type" TO "trigger";--> statement-breakpoint
ALTER TABLE "task" DROP COLUMN "triggerAppAction";--> statement-breakpoint
ALTER TABLE "task" DROP COLUMN "triggerAppInstallId";