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
	"updatedAt" timestamp DEFAULT now(),
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" text,
	"createdAt" timestamp DEFAULT now(),
	"role" varchar DEFAULT 'user' NOT NULL,
	"banned" boolean DEFAULT false NOT NULL,
	"banReason" varchar,
	"banExpires" bigint,
	CONSTRAINT "user_email_unique" UNIQUE("email")
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
CREATE TABLE "attachment" (
	"id" varchar PRIMARY KEY NOT NULL,
	"userId" varchar,
	"messageId" varchar,
	"channelId" varchar,
	"createdAt" timestamp DEFAULT now(),
	"data" text,
	"url" varchar,
	"type" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "channel" (
	"id" varchar PRIMARY KEY NOT NULL,
	"serverId" varchar,
	"name" varchar(200) NOT NULL,
	"description" text,
	"private" boolean DEFAULT false NOT NULL,
	"updatedAt" timestamp,
	"createdAt" timestamp DEFAULT now(),
	"type" varchar(255),
	"deleted" boolean DEFAULT false NOT NULL,
	"latestSearchIndexMessage" varchar,
	"readonly" boolean DEFAULT false NOT NULL,
	"state" jsonb
);
--> statement-breakpoint
CREATE TABLE "channelPermission" (
	"id" varchar PRIMARY KEY NOT NULL,
	"channelId" varchar,
	"serverId" varchar,
	"roleId" varchar,
	"granterId" varchar,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "friendship" (
	"requestingId" varchar NOT NULL,
	"acceptingId" varchar NOT NULL,
	"accepted" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT "friendship_requestingId_acceptingId_pk" PRIMARY KEY("requestingId","acceptingId")
);
--> statement-breakpoint
CREATE TABLE "message" (
	"id" varchar PRIMARY KEY NOT NULL,
	"serverId" varchar,
	"channelId" varchar,
	"replyingToId" varchar,
	"threadId" varchar,
	"creatorId" varchar,
	"content" text NOT NULL,
	"isThreadReply" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp,
	"deleted" boolean DEFAULT false NOT NULL,
	"type" varchar(255),
	"order" varchar,
	"summary" varchar
);
--> statement-breakpoint
CREATE TABLE "messageReaction" (
	"messageId" varchar NOT NULL,
	"creatorId" varchar NOT NULL,
	"reactionId" varchar NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp,
	"channelId" varchar,
	CONSTRAINT "messageReaction_messageId_creatorId_reactionId_pk" PRIMARY KEY("messageId","creatorId","reactionId")
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" varchar PRIMARY KEY NOT NULL,
	"userId" varchar NOT NULL,
	"messageId" varchar NOT NULL,
	"channelId" varchar NOT NULL,
	"serverId" varchar NOT NULL,
	"seenAt" timestamp,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pin" (
	"id" varchar PRIMARY KEY NOT NULL,
	"channelId" varchar,
	"serverId" varchar,
	"messageId" varchar,
	"creatorId" varchar,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reaction" (
	"id" varchar PRIMARY KEY NOT NULL,
	"value" varchar,
	"keyword" varchar,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp,
	"category" varchar,
	"image" varchar,
	"keywords" jsonb DEFAULT '[]'::jsonb,
	CONSTRAINT "reaction_value_unique" UNIQUE("value"),
	CONSTRAINT "reaction_keyword_unique" UNIQUE("keyword")
);
--> statement-breakpoint
CREATE TABLE "role" (
	"id" varchar PRIMARY KEY NOT NULL,
	"serverId" varchar,
	"creatorId" varchar,
	"name" varchar(200) NOT NULL,
	"color" varchar(200) NOT NULL,
	"canAdmin" boolean DEFAULT false NOT NULL,
	"canEditServer" boolean DEFAULT false NOT NULL,
	"canEditChannel" boolean DEFAULT false NOT NULL,
	"updatedAt" timestamp,
	"createdAt" timestamp DEFAULT now(),
	"image" varchar
);
--> statement-breakpoint
CREATE TABLE "seen" (
	"id" varchar PRIMARY KEY NOT NULL,
	"userId" varchar NOT NULL,
	"messageId" varchar,
	"channelId" varchar,
	"seenAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "server" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"domain" varchar(255),
	"creatorId" varchar,
	"description" text,
	"channelSort" jsonb DEFAULT '[]'::jsonb,
	"icon" varchar(255),
	"updatedAt" timestamp,
	"createdAt" timestamp DEFAULT now(),
	"banner" varchar,
	"state" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "serverMember" (
	"serverId" varchar NOT NULL,
	"userId" varchar NOT NULL,
	"hasClosedWelcome" boolean DEFAULT false NOT NULL,
	"joinedAt" timestamp DEFAULT now(),
	CONSTRAINT "serverMember_serverId_userId_pk" PRIMARY KEY("serverId","userId")
);
--> statement-breakpoint
CREATE TABLE "thread" (
	"id" varchar PRIMARY KEY NOT NULL,
	"channelId" varchar,
	"messageId" varchar,
	"creatorId" varchar,
	"title" varchar(200),
	"deleted" boolean DEFAULT false NOT NULL,
	"description" varchar(200),
	"updatedAt" timestamp,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "userPublic" (
	"id" varchar PRIMARY KEY NOT NULL,
	"data" jsonb DEFAULT '{"lastActiveChannel":{}}'::jsonb,
	"lastActive" timestamp DEFAULT now(),
	"topReactions" jsonb DEFAULT '[]'::jsonb,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	"name" varchar(255) DEFAULT '',
	"username" varchar(200) DEFAULT '',
	"image" text DEFAULT '',
	"joinedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "userRole" (
	"serverId" varchar NOT NULL,
	"userId" varchar NOT NULL,
	"roleId" varchar NOT NULL,
	"granterId" varchar,
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT "userRole_serverId_userId_roleId_pk" PRIMARY KEY("serverId","userId","roleId")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_userId_userPublic_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."userPublic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_messageId_message_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_channelId_channel_id_fk" FOREIGN KEY ("channelId") REFERENCES "public"."channel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel" ADD CONSTRAINT "channel_serverId_server_id_fk" FOREIGN KEY ("serverId") REFERENCES "public"."server"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channelPermission" ADD CONSTRAINT "channelPermission_channelId_channel_id_fk" FOREIGN KEY ("channelId") REFERENCES "public"."channel"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channelPermission" ADD CONSTRAINT "channelPermission_serverId_server_id_fk" FOREIGN KEY ("serverId") REFERENCES "public"."server"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channelPermission" ADD CONSTRAINT "channelPermission_roleId_role_id_fk" FOREIGN KEY ("roleId") REFERENCES "public"."role"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channelPermission" ADD CONSTRAINT "channelPermission_granterId_userPublic_id_fk" FOREIGN KEY ("granterId") REFERENCES "public"."userPublic"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendship" ADD CONSTRAINT "friendship_requestingId_userPublic_id_fk" FOREIGN KEY ("requestingId") REFERENCES "public"."userPublic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendship" ADD CONSTRAINT "friendship_acceptingId_userPublic_id_fk" FOREIGN KEY ("acceptingId") REFERENCES "public"."userPublic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_serverId_server_id_fk" FOREIGN KEY ("serverId") REFERENCES "public"."server"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_channelId_channel_id_fk" FOREIGN KEY ("channelId") REFERENCES "public"."channel"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_threadId_thread_id_fk" FOREIGN KEY ("threadId") REFERENCES "public"."thread"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_creatorId_userPublic_id_fk" FOREIGN KEY ("creatorId") REFERENCES "public"."userPublic"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messageReaction" ADD CONSTRAINT "messageReaction_messageId_message_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messageReaction" ADD CONSTRAINT "messageReaction_creatorId_userPublic_id_fk" FOREIGN KEY ("creatorId") REFERENCES "public"."userPublic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messageReaction" ADD CONSTRAINT "messageReaction_reactionId_reaction_id_fk" FOREIGN KEY ("reactionId") REFERENCES "public"."reaction"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messageReaction" ADD CONSTRAINT "messageReaction_channelId_channel_id_fk" FOREIGN KEY ("channelId") REFERENCES "public"."channel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pin" ADD CONSTRAINT "pin_channelId_channel_id_fk" FOREIGN KEY ("channelId") REFERENCES "public"."channel"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pin" ADD CONSTRAINT "pin_serverId_server_id_fk" FOREIGN KEY ("serverId") REFERENCES "public"."server"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pin" ADD CONSTRAINT "pin_messageId_message_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pin" ADD CONSTRAINT "pin_creatorId_userPublic_id_fk" FOREIGN KEY ("creatorId") REFERENCES "public"."userPublic"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role" ADD CONSTRAINT "role_serverId_server_id_fk" FOREIGN KEY ("serverId") REFERENCES "public"."server"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role" ADD CONSTRAINT "role_creatorId_userPublic_id_fk" FOREIGN KEY ("creatorId") REFERENCES "public"."userPublic"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server" ADD CONSTRAINT "server_creatorId_userPublic_id_fk" FOREIGN KEY ("creatorId") REFERENCES "public"."userPublic"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serverMember" ADD CONSTRAINT "serverMember_serverId_server_id_fk" FOREIGN KEY ("serverId") REFERENCES "public"."server"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serverMember" ADD CONSTRAINT "serverMember_userId_userPublic_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."userPublic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread" ADD CONSTRAINT "thread_channelId_channel_id_fk" FOREIGN KEY ("channelId") REFERENCES "public"."channel"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread" ADD CONSTRAINT "thread_creatorId_userPublic_id_fk" FOREIGN KEY ("creatorId") REFERENCES "public"."userPublic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userRole" ADD CONSTRAINT "userRole_serverId_server_id_fk" FOREIGN KEY ("serverId") REFERENCES "public"."server"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userRole" ADD CONSTRAINT "userRole_userId_userPublic_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."userPublic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userRole" ADD CONSTRAINT "userRole_roleId_role_id_fk" FOREIGN KEY ("roleId") REFERENCES "public"."role"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userRole" ADD CONSTRAINT "userRole_granterId_userPublic_id_fk" FOREIGN KEY ("granterId") REFERENCES "public"."userPublic"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "seen_user_channel_idx" ON "seen" USING btree ("userId","channelId");