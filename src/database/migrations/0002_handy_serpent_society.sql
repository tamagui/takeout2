CREATE TABLE "plugin" (
	"id" varchar PRIMARY KEY NOT NULL,
	"creatorId" varchar,
	"description" varchar,
	"name" varchar,
	"type" varchar,
	"updatedAt" timestamp,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "serverPlugin" (
	"serverId" varchar,
	"creatorId" varchar,
	"pluginId" varchar,
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT "serverPlugin_serverId_creatorId_pluginId_pk" PRIMARY KEY("serverId","creatorId","pluginId")
);
--> statement-breakpoint
ALTER TABLE "plugin" ADD CONSTRAINT "plugin_creatorId_userPublic_id_fk" FOREIGN KEY ("creatorId") REFERENCES "public"."userPublic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serverPlugin" ADD CONSTRAINT "serverPlugin_serverId_server_id_fk" FOREIGN KEY ("serverId") REFERENCES "public"."server"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serverPlugin" ADD CONSTRAINT "serverPlugin_creatorId_userPublic_id_fk" FOREIGN KEY ("creatorId") REFERENCES "public"."userPublic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serverPlugin" ADD CONSTRAINT "serverPlugin_pluginId_plugin_id_fk" FOREIGN KEY ("pluginId") REFERENCES "public"."plugin"("id") ON DELETE cascade ON UPDATE no action;