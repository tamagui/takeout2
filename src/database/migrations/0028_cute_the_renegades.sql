ALTER TABLE "channel" ALTER COLUMN "isPrivateChat" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "channel" ALTER COLUMN "isPrivateChat" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "server" ALTER COLUMN "isPrivateChat" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "server" ALTER COLUMN "isPrivateChat" SET NOT NULL;