DROP TABLE "admin" CASCADE;--> statement-breakpoint
DROP TABLE "follows" CASCADE;--> statement-breakpoint
DROP TABLE "like" CASCADE;--> statement-breakpoint
DROP TABLE "notification" CASCADE;--> statement-breakpoint
ALTER TABLE "post" DROP COLUMN "likesCount";--> statement-breakpoint
ALTER TABLE "post" DROP COLUMN "draft";--> statement-breakpoint
ALTER TABLE "userPublic" DROP COLUMN "bio";--> statement-breakpoint
ALTER TABLE "userPublic" DROP COLUMN "ranking";--> statement-breakpoint
ALTER TABLE "userPublic" DROP COLUMN "walletAddress";--> statement-breakpoint
ALTER TABLE "userPublic" DROP COLUMN "socialLinks";--> statement-breakpoint
ALTER TABLE "userPublic" DROP COLUMN "lastActive";--> statement-breakpoint
ALTER TABLE "userStats" DROP COLUMN "followersCount";--> statement-breakpoint
ALTER TABLE "userStats" DROP COLUMN "followingCount";