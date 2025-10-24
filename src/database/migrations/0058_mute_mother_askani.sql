CREATE TABLE "messageReactionStats" (
	"messageId" varchar NOT NULL,
	"reactionId" varchar NOT NULL,
	"reactionValue" varchar NOT NULL,
	"reactionImage" varchar,
	"reactionCount" integer NOT NULL,
	"firstThreeUsers" jsonb NOT NULL,
	"lastRefreshedAt" bigint NOT NULL,
	CONSTRAINT "messageReactionStats_messageId_reactionId_pk" PRIMARY KEY("messageId","reactionId")
);
--> statement-breakpoint
ALTER TABLE "messageReactionStats" ADD CONSTRAINT "messageReactionStats_messageId_message_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messageReactionStats" ADD CONSTRAINT "messageReactionStats_reactionId_reaction_id_fk" FOREIGN KEY ("reactionId") REFERENCES "public"."reaction"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idxMessageReactionStatsMessage" ON "messageReactionStats" USING btree ("messageId");--> statement-breakpoint
CREATE INDEX "idxMessageReactionStatsReaction" ON "messageReactionStats" USING btree ("reactionId");