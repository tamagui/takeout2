CREATE TABLE "comment" (
	"id" text PRIMARY KEY NOT NULL,
	"postId" text NOT NULL,
	"userId" text NOT NULL,
	"content" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "post" ADD COLUMN "commentCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "comment_postId_idx" ON "comment" USING btree ("postId");--> statement-breakpoint
CREATE INDEX "comment_userId_idx" ON "comment" USING btree ("userId");