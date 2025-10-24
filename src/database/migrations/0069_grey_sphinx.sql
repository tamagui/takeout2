CREATE TABLE "channelActive" (
	"userId" varchar NOT NULL,
	"channelId" varchar NOT NULL,
	"lastSeenAt" timestamp DEFAULT now() NOT NULL,
	"hasAudio" boolean,
	"hasVideo" boolean,
	CONSTRAINT "channelActive_userId_channelId_pk" PRIMARY KEY("userId","channelId")
);
--> statement-breakpoint
ALTER TABLE "channelActive" ADD CONSTRAINT "channelActive_userId_userPublic_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."userPublic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channelActive" ADD CONSTRAINT "channelActive_channelId_channel_id_fk" FOREIGN KEY ("channelId") REFERENCES "public"."channel"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_channelActive_channel" ON "channelActive" USING btree ("channelId","lastSeenAt");