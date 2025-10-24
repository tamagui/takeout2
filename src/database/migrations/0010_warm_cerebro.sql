ALTER TABLE "serverApp" DROP CONSTRAINT "serverApp_serverId_creatorId_appId_pk";--> statement-breakpoint
ALTER TABLE "serverApp" ALTER COLUMN "serverId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "serverApp" ALTER COLUMN "creatorId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "serverApp" ALTER COLUMN "appId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "public" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "serverApp" ADD COLUMN "id" varchar PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "serverApp" ADD COLUMN "threadId" varchar;--> statement-breakpoint
ALTER TABLE "serverApp" ADD CONSTRAINT "serverApp_threadId_thread_id_fk" FOREIGN KEY ("threadId") REFERENCES "public"."thread"("id") ON DELETE cascade ON UPDATE no action;