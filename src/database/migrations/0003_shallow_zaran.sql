CREATE TABLE "userState" (
	"id" varchar PRIMARY KEY NOT NULL,
	"type" varchar,
	"userId" varchar,
	"value" jsonb,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
