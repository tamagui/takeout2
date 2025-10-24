ALTER TABLE "serverApp" DROP CONSTRAINT "serverApp_serverId_creatorId_appId_threadId_pk";--> statement-breakpoint
ALTER TABLE "serverApp" ADD CONSTRAINT "serverApp_appId_pk" PRIMARY KEY("appId");