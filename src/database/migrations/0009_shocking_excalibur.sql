ALTER TABLE "plugin" RENAME TO "app";--> statement-breakpoint
ALTER TABLE "serverPlugin" RENAME TO "serverApp";--> statement-breakpoint
ALTER TABLE "serverApp" RENAME COLUMN "pluginId" TO "appId";--> statement-breakpoint
ALTER TABLE "app" DROP CONSTRAINT "plugin_creatorId_userPublic_id_fk";
--> statement-breakpoint
ALTER TABLE "serverApp" DROP CONSTRAINT "serverPlugin_serverId_server_id_fk";
--> statement-breakpoint
ALTER TABLE "serverApp" DROP CONSTRAINT "serverPlugin_creatorId_userPublic_id_fk";
--> statement-breakpoint
ALTER TABLE "serverApp" DROP CONSTRAINT "serverPlugin_pluginId_plugin_id_fk";
--> statement-breakpoint
ALTER TABLE "serverApp" DROP CONSTRAINT "serverPlugin_serverId_creatorId_pluginId_pk";--> statement-breakpoint
ALTER TABLE "serverApp" ADD CONSTRAINT "serverApp_serverId_creatorId_appId_pk" PRIMARY KEY("serverId","creatorId","appId");--> statement-breakpoint
ALTER TABLE "app" ADD CONSTRAINT "app_creatorId_userPublic_id_fk" FOREIGN KEY ("creatorId") REFERENCES "public"."userPublic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serverApp" ADD CONSTRAINT "serverApp_serverId_server_id_fk" FOREIGN KEY ("serverId") REFERENCES "public"."server"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serverApp" ADD CONSTRAINT "serverApp_creatorId_userPublic_id_fk" FOREIGN KEY ("creatorId") REFERENCES "public"."userPublic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serverApp" ADD CONSTRAINT "serverApp_appId_app_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;