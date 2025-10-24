CREATE TABLE "privateChatsStats" (
	"serverId" varchar NOT NULL,
	"userServerId" varchar NOT NULL,
	"userAId" varchar NOT NULL,
	"userBId" varchar NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"lastMessageAt" timestamp NOT NULL,
	"messageCountWeek" integer DEFAULT 0 NOT NULL,
	"messageCountMonth" integer DEFAULT 0 NOT NULL,
	"messageCountYear" integer DEFAULT 0 NOT NULL,
	"lastRefreshedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "privateChatsStats_serverId_userServerId_pk" PRIMARY KEY("serverId","userServerId")
);
--> statement-breakpoint
ALTER TABLE "privateChatsStats" ADD CONSTRAINT "privateChatsStats_serverId_server_id_fk" FOREIGN KEY ("serverId") REFERENCES "public"."server"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "privateChatsStats" ADD CONSTRAINT "privateChatsStats_userServerId_server_id_fk" FOREIGN KEY ("userServerId") REFERENCES "public"."server"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "privateChatsStats" ADD CONSTRAINT "privateChatsStats_userAId_userPublic_id_fk" FOREIGN KEY ("userAId") REFERENCES "public"."userPublic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "privateChatsStats" ADD CONSTRAINT "privateChatsStats_userBId_userPublic_id_fk" FOREIGN KEY ("userBId") REFERENCES "public"."userPublic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_privateChatsStats_server" ON "privateChatsStats" USING btree ("serverId","score");--> statement-breakpoint
CREATE INDEX "idx_privateChatsStats_userA" ON "privateChatsStats" USING btree ("serverId","userAId","score");--> statement-breakpoint
CREATE INDEX "idx_privateChatsStats_userB" ON "privateChatsStats" USING btree ("serverId","userBId","score");