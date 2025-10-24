CREATE TABLE "appInstallPermission" (
	"id" varchar PRIMARY KEY NOT NULL,
	"appInstallId" varchar,
	"serverId" varchar,
	"roleId" varchar,
	"granterId" varchar,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "role" ADD COLUMN "canEditApp" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "appInstallPermission" ADD CONSTRAINT "appInstallPermission_appInstallId_appInstall_id_fk" FOREIGN KEY ("appInstallId") REFERENCES "public"."appInstall"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appInstallPermission" ADD CONSTRAINT "appInstallPermission_serverId_server_id_fk" FOREIGN KEY ("serverId") REFERENCES "public"."server"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appInstallPermission" ADD CONSTRAINT "appInstallPermission_roleId_role_id_fk" FOREIGN KEY ("roleId") REFERENCES "public"."role"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appInstallPermission" ADD CONSTRAINT "appInstallPermission_granterId_userPublic_id_fk" FOREIGN KEY ("granterId") REFERENCES "public"."userPublic"("id") ON DELETE no action ON UPDATE no action;