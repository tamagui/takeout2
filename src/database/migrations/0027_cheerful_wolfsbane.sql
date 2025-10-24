ALTER TABLE "channel" ADD COLUMN "isPrivateChat" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "server" ADD COLUMN "isPrivateChat" boolean DEFAULT false;
