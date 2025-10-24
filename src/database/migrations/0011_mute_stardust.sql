ALTER TABLE "serverApp" ALTER COLUMN "serverId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "serverApp" ALTER COLUMN "creatorId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "serverApp" ALTER COLUMN "appId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "serverApp" DROP COLUMN "id";
ALTER TABLE "serverApp" ADD CONSTRAINT "serverApp_serverId_creatorId_appId_threadId_pk" PRIMARY KEY("serverId","creatorId","appId","threadId");--> statement-breakpoint
