import type { InferSelectModel } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  json,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from 'drizzle-orm/pg-core'

// Core user table
export const userPublic = pgTable('userPublic', (t) => ({
  id: text('id').primaryKey(),
  name: text('name'),
  username: text('username'),
  image: text('image'),
  bio: text('bio'),
  ranking: integer('ranking'),
  walletAddress: text('walletAddress'),
  socialLinks: json('socialLinks'),
  lastActive: integer('lastActive'),
  joinedAt: integer('joinedAt').notNull(),
  hasOnboarded: boolean('hasOnboarded').notNull().default(false),
  whitelisted: boolean('whitelisted').notNull().default(false),
  migrationVersion: integer('migrationVersion').notNull().default(0),
}))

export const userState = pgTable('userState', (t) => ({
  userId: text('userId').primaryKey(),
  darkMode: boolean('darkMode').notNull().default(false),
  locale: text('locale').notNull().default('en'),
  timeZone: text('timeZone').notNull().default('UTC'),
  onlineStatus: text('onlineStatus').notNull().default('online'),
  lastNotificationReadAt: integer('lastNotificationReadAt'),
}))

export const userStats = pgTable('userStats', (t) => ({
  id: text('id').primaryKey(), // userId foreign key
  followersCount: integer('followersCount').notNull().default(0),
  followingCount: integer('followingCount').notNull().default(0),
  postsCount: integer('postsCount').notNull().default(0),
}))

// Social models
export const post = pgTable(
  'post',
  (t) => ({
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    image: text('image').notNull(),
    likesCount: integer('likesCount').notNull().default(0),
    caption: text('caption'),
    draft: boolean('draft').notNull().default(false),
    hiddenByAdmin: boolean('hiddenByAdmin').notNull().default(false),
    createdAt: integer('createdAt').notNull(),
    updatedAt: integer('updatedAt'),
  }),
  (table) => ({
    userIdIdx: index('post_userId_idx').on(table.userId),
    createdAtIdx: index('post_createdAt_idx').on(table.createdAt),
  })
)

export const like = pgTable(
  'like',
  (t) => ({
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    postId: text('postId').notNull(),
    createdAt: integer('createdAt').notNull(),
  }),
  (table) => ({
    userPostUnique: unique('like_user_post_unique').on(table.userId, table.postId),
    userIdIdx: index('like_userId_idx').on(table.userId),
    postIdIdx: index('like_postId_idx').on(table.postId),
  })
)

export const follows = pgTable(
  'follows',
  (t) => ({
    id: text('id').primaryKey(),
    followerId: text('followerId').notNull(), // user who is following
    followingId: text('followingId').notNull(), // user being followed
    createdAt: integer('createdAt').notNull(),
  }),
  (table) => ({
    followerFollowingUnique: unique('follows_follower_following_unique').on(
      table.followerId,
      table.followingId
    ),
    followerIdIdx: index('follows_followerId_idx').on(table.followerId),
    followingIdIdx: index('follows_followingId_idx').on(table.followingId),
  })
)

export const block = pgTable(
  'block',
  (t) => ({
    id: text('id').primaryKey(),
    blockerId: text('blockerId').notNull(), // user who blocks
    blockedId: text('blockedId').notNull(), // user being blocked
    createdAt: integer('createdAt').notNull(),
  }),
  (table) => ({
    blockerBlockedUnique: unique('block_blocker_blocked_unique').on(
      table.blockerId,
      table.blockedId
    ),
    blockerIdIdx: index('block_blockerId_idx').on(table.blockerId),
    blockedIdIdx: index('block_blockedId_idx').on(table.blockedId),
  })
)

export const report = pgTable(
  'report',
  (t) => ({
    id: text('id').primaryKey(),
    reporterId: text('reporterId').notNull(),
    reportedUserId: text('reportedUserId'),
    reportedPostId: text('reportedPostId'),
    reason: text('reason').notNull(),
    details: text('details'),
    status: text('status').notNull().default('pending'), // pending, reviewed, resolved
    reviewedBy: text('reviewedBy'),
    reviewedAt: integer('reviewedAt'),
    createdAt: integer('createdAt').notNull(),
  }),
  (table) => ({
    reporterIdIdx: index('report_reporterId_idx').on(table.reporterId),
    reportedUserIdIdx: index('report_reportedUserId_idx').on(table.reportedUserId),
    reportedPostIdIdx: index('report_reportedPostId_idx').on(table.reportedPostId),
    statusIdx: index('report_status_idx').on(table.status),
  })
)

// Utility models
export const device = pgTable(
  'device',
  (t) => ({
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    name: text('name'),
    platform: text('platform').notNull(), // ios, android, web
    platformVersion: text('platformVersion'),
    appVersion: text('appVersion'),
    pushToken: text('pushToken'),
    pushEnabled: boolean('pushEnabled').notNull().default(false),
    lastActiveAt: integer('lastActiveAt'),
    createdAt: integer('createdAt').notNull(),
    updatedAt: integer('updatedAt'),
  }),
  (table) => ({
    userIdIdx: index('device_userId_idx').on(table.userId),
    pushTokenIdx: index('device_pushToken_idx').on(table.pushToken),
  })
)

// Named 'invite' for compatibility with auth system
export const invite = pgTable(
  'invite',
  (t) => ({
    id: text('id').primaryKey(),
    code: text('code').notNull().unique(),
    email: text('email'),
    usedBy: text('usedBy'),
    usedAt: integer('usedAt'),
    createdBy: text('createdBy'),
    createdAt: integer('createdAt').notNull(),
    expiresAt: integer('expiresAt'),
    maxUses: integer('maxUses').notNull().default(1),
    useCount: integer('useCount').notNull().default(0),
  }),
  (table) => ({
    codeIdx: unique('invite_code_idx').on(table.code),
    emailIdx: index('invite_email_idx').on(table.email),
  })
)

// Export with both names for compatibility
export const privateBetaInvite = invite

// Admin table for special admin users
export const admin = pgTable('admin', (t) => ({
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: integer('createdAt').notNull(),
}))

// Notification table for the social app
export const notification = pgTable(
  'notification',
  (t) => ({
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    type: text('type').notNull(), // like, follow, mention, report
    actorId: text('actorId'), // user who triggered the notification
    postId: text('postId'),
    message: text('message'),
    read: boolean('read').notNull().default(false),
    createdAt: integer('createdAt').notNull(),
  }),
  (table) => ({
    userIdIdx: index('notification_userId_idx').on(table.userId),
    readIdx: index('notification_read_idx').on(table.read),
    createdAtIdx: index('notification_createdAt_idx').on(table.createdAt),
  })
)

// Type exports
export type UserPublic = InferSelectModel<typeof userPublic>
export type UserState = InferSelectModel<typeof userState>
export type UserStats = InferSelectModel<typeof userStats>
export type Post = InferSelectModel<typeof post>
export type Like = InferSelectModel<typeof like>
export type Follows = InferSelectModel<typeof follows>
export type Block = InferSelectModel<typeof block>
export type Report = InferSelectModel<typeof report>
export type Device = InferSelectModel<typeof device>
export type Invite = InferSelectModel<typeof invite>
export type PrivateBetaInvite = Invite
export type Admin = InferSelectModel<typeof admin>
export type Notification = InferSelectModel<typeof notification>
