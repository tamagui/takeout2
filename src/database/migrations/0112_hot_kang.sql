CREATE TABLE "taskRun" (
	"id" varchar PRIMARY KEY NOT NULL,
	"taskId" varchar,
	"creatorId" varchar,
	"logs" text,
	"status" varchar,
	"stepsStatus" jsonb,
	"output" text,
	"error" text,
	"createdAt" timestamp,
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "schedule" jsonb;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "steps" jsonb;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "triggerAppAction" varchar;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "triggerAppInstallId" varchar;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "type" varchar;--> statement-breakpoint
ALTER TABLE "taskRun" ADD CONSTRAINT "taskRun_taskId_task_id_fk" FOREIGN KEY ("taskId") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taskRun" ADD CONSTRAINT "taskRun_creatorId_userPublic_id_fk" FOREIGN KEY ("creatorId") REFERENCES "public"."userPublic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "task" DROP COLUMN "logs";--> statement-breakpoint
ALTER TABLE "task" DROP COLUMN "errorMessage";