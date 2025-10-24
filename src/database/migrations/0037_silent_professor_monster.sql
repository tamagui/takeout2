CREATE TABLE "appState" (
	"id" text
);
--> statement-breakpoint
CREATE TABLE "keyValue" (
	"key" varchar PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updatedAt" timestamp DEFAULT now()
);
