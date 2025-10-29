CREATE TABLE "whitelist" (
	"id" text PRIMARY KEY NOT NULL,
	"email" varchar(200) NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT "whitelist_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "userStats" RENAME TO "userProfile";