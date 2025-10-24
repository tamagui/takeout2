CREATE TABLE "privateBetaInvite" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar NOT NULL,
	"accepted" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp
);
--> statement-breakpoint
CREATE INDEX "idx_privateBetaInvite_email" ON "privateBetaInvite" USING btree ("email");