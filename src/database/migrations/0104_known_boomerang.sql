ALTER TABLE "task" ALTER COLUMN "createdAt" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "task" ALTER COLUMN "updatedAt" SET DEFAULT now();