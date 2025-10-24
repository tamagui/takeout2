CREATE TABLE "invite" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar NOT NULL,
	"serverId" varchar NOT NULL,
	"roleId" varchar,
	"inviterId" varchar NOT NULL,
	"accepted" boolean DEFAULT false NOT NULL,
	"acceptedAt" timestamp,
	"acceptedById" varchar,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "invite" ADD CONSTRAINT "invite_serverId_server_id_fk" FOREIGN KEY ("serverId") REFERENCES "public"."server"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite" ADD CONSTRAINT "invite_roleId_role_id_fk" FOREIGN KEY ("roleId") REFERENCES "public"."role"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite" ADD CONSTRAINT "invite_inviterId_userPublic_id_fk" FOREIGN KEY ("inviterId") REFERENCES "public"."userPublic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite" ADD CONSTRAINT "invite_acceptedById_userPublic_id_fk" FOREIGN KEY ("acceptedById") REFERENCES "public"."userPublic"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_invite_email" ON "invite" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_invite_server" ON "invite" USING btree ("serverId");--> statement-breakpoint
CREATE INDEX "idx_invite_role" ON "invite" USING btree ("roleId");--> statement-breakpoint
CREATE INDEX "idx_invite_inviter" ON "invite" USING btree ("inviterId");--> statement-breakpoint
CREATE INDEX "idx_invite_accepted" ON "invite" USING btree ("accepted");--> statement-breakpoint
CREATE INDEX "idx_invite_expires" ON "invite" USING btree ("expiresAt");