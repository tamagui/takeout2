CREATE TABLE "job" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"priority" varchar DEFAULT 'normal' NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb,
	"result" jsonb,
	"logs" text,
	"error" text,
	"progress" integer DEFAULT 0,
	"maxRetries" integer DEFAULT 3,
	"retryCount" integer DEFAULT 0,
	"scheduledFor" timestamp,
	"startedAt" timestamp,
	"completedAt" timestamp,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "idx_job_status" ON "job" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_job_name" ON "job" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_job_created" ON "job" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "idx_job_status_priority" ON "job" USING btree ("status","priority");