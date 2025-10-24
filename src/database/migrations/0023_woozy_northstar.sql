ALTER TABLE "data" ADD COLUMN "appInstallId" varchar;--> statement-breakpoint
ALTER TABLE "data" ADD COLUMN "permissions" varchar;--> statement-breakpoint
ALTER TABLE "data" ADD CONSTRAINT "data_appInstallId_app_id_fk" FOREIGN KEY ("appInstallId") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;