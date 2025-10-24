CREATE TABLE "task" (
	"id" varchar PRIMARY KEY NOT NULL,
	"appInstallId" varchar,
	"complete" boolean DEFAULT false NOT NULL,
	"creatorId" varchar,
	"description" text,
	"logs" text,
	"errorMessage" text,
	"serverId" varchar NOT NULL,
	"status" varchar,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_appInstallId_appInstall_id_fk" FOREIGN KEY ("appInstallId") REFERENCES "public"."appInstall"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_creatorId_userPublic_id_fk" FOREIGN KEY ("creatorId") REFERENCES "public"."userPublic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_serverId_server_id_fk" FOREIGN KEY ("serverId") REFERENCES "public"."server"("id") ON DELETE cascade ON UPDATE no action;