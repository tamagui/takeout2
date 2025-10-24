CREATE TABLE "channelTopic" (
	"id" varchar PRIMARY KEY NOT NULL,
	"serverId" varchar,
	"channelId" varchar,
	"name" varchar(200) NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "channelTopicMessage" (
	"id" varchar PRIMARY KEY NOT NULL,
	"channelId" varchar,
	"topicId" varchar,
	"messageId" varchar,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "channelTopic" ADD CONSTRAINT "channelTopic_serverId_server_id_fk" FOREIGN KEY ("serverId") REFERENCES "public"."server"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channelTopic" ADD CONSTRAINT "channelTopic_channelId_channel_id_fk" FOREIGN KEY ("channelId") REFERENCES "public"."channel"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channelTopicMessage" ADD CONSTRAINT "channelTopicMessage_channelId_channel_id_fk" FOREIGN KEY ("channelId") REFERENCES "public"."channel"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channelTopicMessage" ADD CONSTRAINT "channelTopicMessage_topicId_channelTopic_id_fk" FOREIGN KEY ("topicId") REFERENCES "public"."channelTopic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channelTopicMessage" ADD CONSTRAINT "channelTopicMessage_messageId_message_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_channelTopic_channel" ON "channelTopic" USING btree ("channelId");--> statement-breakpoint
CREATE INDEX "idx_channelTopic_server" ON "channelTopic" USING btree ("serverId");--> statement-breakpoint
CREATE INDEX "idx_channelTopicMessage_topic" ON "channelTopicMessage" USING btree ("topicId");--> statement-breakpoint
CREATE INDEX "idx_channelTopicMessage_message" ON "channelTopicMessage" USING btree ("messageId");