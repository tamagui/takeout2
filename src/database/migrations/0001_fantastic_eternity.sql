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
CREATE TABLE IF NOT EXISTS "migrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"run_on" timestamp DEFAULT now() NOT NULL
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
CREATE TABLE "admin" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"createdAt" integer NOT NULL,
	CONSTRAINT "admin_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "block" (
	"id" text PRIMARY KEY NOT NULL,
	"blockerId" text NOT NULL,
	"blockedId" text NOT NULL,
	"createdAt" integer NOT NULL,
	CONSTRAINT "block_blocker_blocked_unique" UNIQUE("blockerId","blockedId")
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
	"lastActiveAt" integer,
	"createdAt" integer NOT NULL,
	"updatedAt" integer
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"id" text PRIMARY KEY NOT NULL,
	"followerId" text NOT NULL,
	"followingId" text NOT NULL,
	"createdAt" integer NOT NULL,
	CONSTRAINT "follows_follower_following_unique" UNIQUE("followerId","followingId")
);
--> statement-breakpoint
CREATE TABLE "invite" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"email" text,
	"usedBy" text,
	"usedAt" integer,
	"createdBy" text,
	"createdAt" integer NOT NULL,
	"expiresAt" integer,
	"maxUses" integer DEFAULT 1 NOT NULL,
	"useCount" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "invite_code_unique" UNIQUE("code"),
	CONSTRAINT "invite_code_idx" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "like" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"postId" text NOT NULL,
	"createdAt" integer NOT NULL,
	CONSTRAINT "like_user_post_unique" UNIQUE("userId","postId")
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"actorId" text,
	"postId" text,
	"message" text,
	"read" boolean DEFAULT false NOT NULL,
	"createdAt" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"image" text NOT NULL,
	"likesCount" integer DEFAULT 0 NOT NULL,
	"caption" text,
	"draft" boolean DEFAULT false NOT NULL,
	"hiddenByAdmin" boolean DEFAULT false NOT NULL,
	"createdAt" integer NOT NULL,
	"updatedAt" integer
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
	"reviewedAt" integer,
	"createdAt" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "userPublic" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"username" text,
	"image" text,
	"bio" text,
	"ranking" integer,
	"walletAddress" text,
	"socialLinks" json,
	"lastActive" integer,
	"joinedAt" integer NOT NULL,
	"hasOnboarded" boolean DEFAULT false NOT NULL,
	"whitelisted" boolean DEFAULT false NOT NULL,
	"migrationVersion" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "userState" (
	"userId" text PRIMARY KEY NOT NULL,
	"darkMode" boolean DEFAULT false NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"timeZone" text DEFAULT 'UTC' NOT NULL,
	"onlineStatus" text DEFAULT 'online' NOT NULL,
	"lastNotificationReadAt" integer
);
--> statement-breakpoint
CREATE TABLE "userStats" (
	"id" text PRIMARY KEY NOT NULL,
	"followersCount" integer DEFAULT 0 NOT NULL,
	"followingCount" integer DEFAULT 0 NOT NULL,
	"postsCount" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "block_blockerId_idx" ON "block" USING btree ("blockerId");--> statement-breakpoint
CREATE INDEX "block_blockedId_idx" ON "block" USING btree ("blockedId");--> statement-breakpoint
CREATE INDEX "device_userId_idx" ON "device" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "device_pushToken_idx" ON "device" USING btree ("pushToken");--> statement-breakpoint
CREATE INDEX "follows_followerId_idx" ON "follows" USING btree ("followerId");--> statement-breakpoint
CREATE INDEX "follows_followingId_idx" ON "follows" USING btree ("followingId");--> statement-breakpoint
CREATE INDEX "invite_email_idx" ON "invite" USING btree ("email");--> statement-breakpoint
CREATE INDEX "like_userId_idx" ON "like" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "like_postId_idx" ON "like" USING btree ("postId");--> statement-breakpoint
CREATE INDEX "notification_userId_idx" ON "notification" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "notification_read_idx" ON "notification" USING btree ("read");--> statement-breakpoint
CREATE INDEX "notification_createdAt_idx" ON "notification" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "post_userId_idx" ON "post" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "post_createdAt_idx" ON "post" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "report_reporterId_idx" ON "report" USING btree ("reporterId");--> statement-breakpoint
CREATE INDEX "report_reportedUserId_idx" ON "report" USING btree ("reportedUserId");--> statement-breakpoint
CREATE INDEX "report_reportedPostId_idx" ON "report" USING btree ("reportedPostId");--> statement-breakpoint
CREATE INDEX "report_status_idx" ON "report" USING btree ("status");