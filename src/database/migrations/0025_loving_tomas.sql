ALTER TABLE "data" DROP CONSTRAINT "data_appInstallId_app_id_fk";
--> statement-breakpoint
ALTER TABLE "data" ADD CONSTRAINT "data_appInstallId_appInstall_id_fk" FOREIGN KEY ("appInstallId") REFERENCES "public"."appInstall"("id") ON DELETE cascade ON UPDATE no action;