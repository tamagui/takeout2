CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp,
	"refreshTokenExpiresAt" timestamp,
	"scope" text,
	"password" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jwks" (
	"id" text PRIMARY KEY NOT NULL,
	"publicKey" text NOT NULL,
	"privateKey" text NOT NULL,
	"createdAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL,
	"impersonatedBy" varchar
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" varchar PRIMARY KEY NOT NULL,
	"username" varchar(200),
	"name" varchar(200),
	"email" varchar(200) NOT NULL,
	"normalizedEmail" varchar(200),
	"updatedAt" timestamp DEFAULT now(),
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" text,
	"createdAt" timestamp DEFAULT now(),
	"role" varchar DEFAULT 'user' NOT NULL,
	"banned" boolean DEFAULT false NOT NULL,
	"banReason" varchar,
	"banExpires" bigint,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_normalizedEmail_unique" UNIQUE("normalizedEmail")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp,
	"updatedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "whitelist" (
	"id" text PRIMARY KEY NOT NULL,
	"email" varchar(200) NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT "whitelist_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "block" (
	"id" text PRIMARY KEY NOT NULL,
	"blockerId" text NOT NULL,
	"blockedId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "block_blocker_blocked_unique" UNIQUE("blockerId","blockedId")
);
--> statement-breakpoint
CREATE TABLE "comment" (
	"id" text PRIMARY KEY NOT NULL,
	"postId" text NOT NULL,
	"userId" text NOT NULL,
	"content" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "device" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"name" text,
	"platform" text NOT NULL,
	"platformVersion" text,
	"appVersion" text,
	"pushToken" text,
	"pushEnabled" boolean DEFAULT false NOT NULL,
	"lastActiveAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "invite" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"email" text,
	"usedBy" text,
	"usedAt" timestamp,
	"createdBy" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp,
	"maxUses" integer DEFAULT 1 NOT NULL,
	"useCount" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "invite_code_unique" UNIQUE("code"),
	CONSTRAINT "invite_code_idx" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"actorId" text,
	"type" text NOT NULL,
	"title" text,
	"body" text,
	"data" text,
	"read" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"image" text NOT NULL,
	"imageWidth" integer,
	"imageHeight" integer,
	"caption" text,
	"hiddenByAdmin" boolean DEFAULT false NOT NULL,
	"commentCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "report" (
	"id" text PRIMARY KEY NOT NULL,
	"reporterId" text NOT NULL,
	"reportedUserId" text,
	"reportedPostId" text,
	"reason" text NOT NULL,
	"details" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewedBy" text,
	"reviewedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "userPublic" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"username" text,
	"image" text,
	"joinedAt" timestamp DEFAULT now() NOT NULL,
	"hasOnboarded" boolean DEFAULT false NOT NULL,
	"whitelisted" boolean DEFAULT false NOT NULL,
	"migrationVersion" integer DEFAULT 0 NOT NULL,
	"postsCount" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "userState" (
	"userId" text PRIMARY KEY NOT NULL,
	"darkMode" boolean DEFAULT false NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"timeZone" text DEFAULT 'UTC' NOT NULL,
	"onlineStatus" text DEFAULT 'online' NOT NULL,
	"lastNotificationReadAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "block_blockerId_idx" ON "block" USING btree ("blockerId");--> statement-breakpoint
CREATE INDEX "block_blockedId_idx" ON "block" USING btree ("blockedId");--> statement-breakpoint
CREATE INDEX "comment_postId_idx" ON "comment" USING btree ("postId");--> statement-breakpoint
CREATE INDEX "comment_userId_idx" ON "comment" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "device_userId_idx" ON "device" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "device_pushToken_idx" ON "device" USING btree ("pushToken");--> statement-breakpoint
CREATE INDEX "invite_email_idx" ON "invite" USING btree ("email");--> statement-breakpoint
CREATE INDEX "notification_userId_idx" ON "notification" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "notification_userId_read_idx" ON "notification" USING btree ("userId","read");--> statement-breakpoint
CREATE INDEX "notification_createdAt_idx" ON "notification" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "post_userId_idx" ON "post" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "post_createdAt_idx" ON "post" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "report_reporterId_idx" ON "report" USING btree ("reporterId");--> statement-breakpoint
CREATE INDEX "report_reportedUserId_idx" ON "report" USING btree ("reportedUserId");--> statement-breakpoint
CREATE INDEX "report_reportedPostId_idx" ON "report" USING btree ("reportedPostId");--> statement-breakpoint
CREATE INDEX "report_status_idx" ON "report" USING btree ("status");--> statement-breakpoint
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
DECLARE
  target_post_id text;
  new_count integer;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_post_id := OLD."postId";
  ELSE
    target_post_id := NEW."postId";
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "post" WHERE "id" = target_post_id) THEN
    RETURN NULL;
  END IF;
  SELECT COUNT(*) INTO new_count FROM "comment" WHERE "postId" = target_post_id;
  UPDATE "post" SET "commentCount" = new_count WHERE "id" = target_post_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER post_comment_count_trigger
AFTER INSERT OR DELETE ON "comment"
FOR EACH ROW
EXECUTE FUNCTION update_post_comment_count();