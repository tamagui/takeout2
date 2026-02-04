import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core'

export const userPublic = pgTable('userPublic', {
  id: text('id').primaryKey(),
  name: text('name'),
  username: text('username'),
  image: text('image'),
  joinedAt: timestamp('joinedAt', { mode: 'string' }).defaultNow().notNull(),
  hasOnboarded: boolean('hasOnboarded').notNull().default(false),
  whitelisted: boolean('whitelisted').notNull().default(false),
  migrationVersion: integer('migrationVersion').notNull().default(0),
  postsCount: integer('postsCount').notNull().default(0),
})

export const userState = pgTable('userState', {
  userId: text('userId').primaryKey(),
  darkMode: boolean('darkMode').notNull().default(false),
  locale: text('locale').notNull().default('en'),
  timeZone: text('timeZone').notNull().default('UTC'),
  onlineStatus: text('onlineStatus').notNull().default('online'),
  lastNotificationReadAt: timestamp('lastNotificationReadAt', { mode: 'string' }),
})

export const post = pgTable(
  'post',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    image: text('image').notNull(),
    imageWidth: integer('imageWidth'),
    imageHeight: integer('imageHeight'),
    caption: text('caption'),
    hiddenByAdmin: boolean('hiddenByAdmin').notNull().default(false),
    commentCount: integer('commentCount').notNull().default(0),
    createdAt: timestamp('createdAt', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }),
  },
  (table) => [
    index('post_userId_idx').on(table.userId),
    index('post_createdAt_idx').on(table.createdAt),
  ]
)

export const comment = pgTable(
  'comment',
  {
    id: text('id').primaryKey(),
    postId: text('postId').notNull(),
    userId: text('userId').notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('createdAt', { mode: 'string' }).defaultNow().notNull(),
  },
  (table) => [
    index('comment_postId_idx').on(table.postId),
    index('comment_userId_idx').on(table.userId),
  ]
)

export const block = pgTable(
  'block',
  {
    id: text('id').primaryKey(),
    blockerId: text('blockerId').notNull(), // user who blocks
    blockedId: text('blockedId').notNull(), // user being blocked
    createdAt: timestamp('createdAt', { mode: 'string' }).defaultNow().notNull(),
  },
  (table) => [
    unique('block_blocker_blocked_unique').on(table.blockerId, table.blockedId),
    index('block_blockerId_idx').on(table.blockerId),
    index('block_blockedId_idx').on(table.blockedId),
  ]
)

export const report = pgTable(
  'report',
  {
    id: text('id').primaryKey(),
    reporterId: text('reporterId').notNull(),
    reportedUserId: text('reportedUserId'),
    reportedPostId: text('reportedPostId'),
    reason: text('reason').notNull(),
    details: text('details'),
    status: text('status').notNull().default('pending'), // pending, reviewed, resolved
    reviewedBy: text('reviewedBy'),
    reviewedAt: timestamp('reviewedAt', { mode: 'string' }),
    createdAt: timestamp('createdAt', { mode: 'string' }).defaultNow().notNull(),
  },
  (table) => [
    index('report_reporterId_idx').on(table.reporterId),
    index('report_reportedUserId_idx').on(table.reportedUserId),
    index('report_reportedPostId_idx').on(table.reportedPostId),
    index('report_status_idx').on(table.status),
  ]
)

export const device = pgTable(
  'device',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    name: text('name'),
    platform: text('platform').notNull(), // ios, android, web
    platformVersion: text('platformVersion'),
    appVersion: text('appVersion'),
    pushToken: text('pushToken'),
    pushEnabled: boolean('pushEnabled').notNull().default(false),
    lastActiveAt: timestamp('lastActiveAt', { mode: 'string' }),
    createdAt: timestamp('createdAt', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }),
  },
  (table) => [
    index('device_userId_idx').on(table.userId),
    index('device_pushToken_idx').on(table.pushToken),
  ]
)

export const invite = pgTable(
  'invite',
  {
    id: text('id').primaryKey(),
    code: text('code').notNull().unique(),
    email: text('email'),
    usedBy: text('usedBy'),
    usedAt: timestamp('usedAt', { mode: 'string' }),
    createdBy: text('createdBy'),
    createdAt: timestamp('createdAt', { mode: 'string' }).defaultNow().notNull(),
    expiresAt: timestamp('expiresAt', { mode: 'string' }),
    maxUses: integer('maxUses').notNull().default(1),
    useCount: integer('useCount').notNull().default(0),
  },
  (table) => [
    unique('invite_code_idx').on(table.code),
    index('invite_email_idx').on(table.email),
  ]
)

export const notification = pgTable(
  'notification',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    actorId: text('actorId'), // user who triggered the notification
    type: text('type').notNull(), // 'comment' | 'system'
    title: text('title'),
    body: text('body'),
    data: text('data'), // json string
    read: boolean('read').notNull().default(false),
    createdAt: timestamp('createdAt', { mode: 'string' }).defaultNow().notNull(),
  },
  (table) => [
    index('notification_userId_idx').on(table.userId),
    index('notification_userId_read_idx').on(table.userId, table.read),
    index('notification_createdAt_idx').on(table.createdAt),
  ]
)
