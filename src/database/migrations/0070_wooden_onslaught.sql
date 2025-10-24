CREATE TABLE "meeting" (
	"id" varchar PRIMARY KEY NOT NULL,
	"serverId" varchar NOT NULL,
	"channelId" varchar NOT NULL,
	"cloudflareId" varchar NOT NULL,
	"authToken" text,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	CONSTRAINT "meeting_cloudflareId_unique" UNIQUE("cloudflareId")
);
--> statement-breakpoint
CREATE TABLE "meetingUser" (
	"id" varchar PRIMARY KEY NOT NULL,
	"meetingId" varchar NOT NULL,
	"userId" varchar NOT NULL,
	"participantToken" text,
	"joinedAt" timestamp DEFAULT now(),
	"leftAt" timestamp,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "meeting" ADD CONSTRAINT "meeting_serverId_server_id_fk" FOREIGN KEY ("serverId") REFERENCES "public"."server"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting" ADD CONSTRAINT "meeting_channelId_channel_id_fk" FOREIGN KEY ("channelId") REFERENCES "public"."channel"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetingUser" ADD CONSTRAINT "meetingUser_meetingId_meeting_id_fk" FOREIGN KEY ("meetingId") REFERENCES "public"."meeting"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetingUser" ADD CONSTRAINT "meetingUser_userId_userPublic_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."userPublic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_meeting_channel" ON "meeting" USING btree ("channelId","active");--> statement-breakpoint
CREATE INDEX "idx_meeting_server" ON "meeting" USING btree ("serverId","active");--> statement-breakpoint
CREATE INDEX "idx_meetingUser_meeting" ON "meetingUser" USING btree ("meetingId","active");--> statement-breakpoint
CREATE INDEX "idx_meetingUser_user" ON "meetingUser" USING btree ("userId","active");