CREATE TABLE "data" (
	"id" varchar PRIMARY KEY NOT NULL,
	"serverId" varchar NOT NULL,
	"channelId" varchar NOT NULL,
	"creatorId" varchar,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"reliability" integer DEFAULT 1,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp,
	"type" varchar(255)
);
--> statement-breakpoint
ALTER TABLE "data" ADD CONSTRAINT "data_serverId_server_id_fk" FOREIGN KEY ("serverId") REFERENCES "public"."server"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data" ADD CONSTRAINT "data_channelId_channel_id_fk" FOREIGN KEY ("channelId") REFERENCES "public"."channel"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data" ADD CONSTRAINT "data_creatorId_userPublic_id_fk" FOREIGN KEY ("creatorId") REFERENCES "public"."userPublic"("id") ON DELETE cascade ON UPDATE no action;