ALTER TABLE "channelPermission" DROP CONSTRAINT "channelPermission_roleId_role_id_fk";
--> statement-breakpoint
ALTER TABLE "channelPermission" ADD CONSTRAINT "channelPermission_roleId_role_id_fk" FOREIGN KEY ("roleId") REFERENCES "public"."role"("id") ON DELETE no action ON UPDATE no action;