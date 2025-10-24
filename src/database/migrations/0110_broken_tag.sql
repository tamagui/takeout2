ALTER TABLE "app" ADD COLUMN "type" varchar;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "serverId" varchar;--> statement-breakpoint
ALTER TABLE "app" ADD CONSTRAINT "app_serverId_server_id_fk" FOREIGN KEY ("serverId") REFERENCES "public"."server"("id") ON DELETE cascade ON UPDATE no action;