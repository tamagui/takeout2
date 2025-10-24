ALTER TABLE "data" DROP CONSTRAINT "data_appId_appInstall_id_fk";
--> statement-breakpoint
ALTER TABLE "data" ADD CONSTRAINT "data_appId_app_id_fk" FOREIGN KEY ("appId") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;