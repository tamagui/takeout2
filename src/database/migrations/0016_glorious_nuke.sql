ALTER TABLE "serverApp" RENAME TO "appInstall";--> statement-breakpoint
ALTER TABLE "app" RENAME COLUMN "installs" TO "installCount";--> statement-breakpoint
ALTER TABLE "appInstall" DROP CONSTRAINT "serverApp_serverId_server_id_fk";
--> statement-breakpoint
ALTER TABLE "appInstall" DROP CONSTRAINT "serverApp_appId_app_id_fk";
--> statement-breakpoint
ALTER TABLE "appInstall" DROP CONSTRAINT "serverApp_serverId_creatorId_appId_pk";--> statement-breakpoint
ALTER TABLE "appInstall" ADD COLUMN "id" varchar PRIMARY KEY NOT NULL DEFAULT md5(random()::text);--> statement-breakpoint
ALTER TABLE "appInstall" ADD COLUMN "data" jsonb DEFAULT '{"options":{}}'::jsonb;--> statement-breakpoint
ALTER TABLE "appInstall" ADD CONSTRAINT "appInstall_serverId_server_id_fk" FOREIGN KEY ("serverId") REFERENCES "public"."server"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appInstall" ADD CONSTRAINT "appInstall_appId_app_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;
