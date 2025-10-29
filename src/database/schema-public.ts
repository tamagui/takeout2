import { boolean, index, integer, pgTable, text, unique } from 'drizzle-orm/pg-core'

export const userPublic = pgTable('userPublic', (t) => ({
  id: text('id').primaryKey(),
  name: text('name'),
  username: text('username'),
  image: text('image'),
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
  id: text('id').primaryKey(),
  postsCount: integer('postsCount').notNull().default(0),
}))

export const post = pgTable(
  'post',
  (t) => ({
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    image: text('image').notNull(),
    caption: text('caption'),
    hiddenByAdmin: boolean('hiddenByAdmin').notNull().default(false),
    createdAt: integer('createdAt').notNull(),
    updatedAt: integer('updatedAt'),
  }),
  (table) => ({
    userIdIdx: index('post_userId_idx').on(table.userId),
    createdAtIdx: index('post_createdAt_idx').on(table.createdAt),
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

export const privateBetaInvite = pgTable(
  'privateBetaInvite',
  (t) => ({
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    accepted: boolean('accepted').notNull().default(false),
    createdAt: integer('createdAt').notNull(),
    updatedAt: integer('updatedAt'),
  }),
  (table) => ({
    emailIdx: index('privateBetaInvite_email_idx').on(table.email),
  })
)
