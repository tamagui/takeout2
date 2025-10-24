CREATE TABLE "indicator" (
	"id" varchar PRIMARY KEY NOT NULL,
	"type" varchar DEFAULT 'typing' NOT NULL,
	"serverId" varchar,
	"channelId" varchar,
	"threadId" varchar,
	"userId" varchar NOT NULL,
	"lastActiveAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "indicator" ADD CONSTRAINT "indicator_userId_userPublic_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."userPublic"("id") ON DELETE cascade ON UPDATE no action;