// private tables (excluded from zero replication)

import { pgTable } from 'drizzle-orm/pg-core'

import type { InferSelectModel } from 'drizzle-orm'

export type Whitelist = InferSelectModel<typeof whitelist>

export const user = pgTable('user', (t) => ({
  id: t.varchar('id').primaryKey(),
  username: t.varchar('username', { length: 200 }),
  name: t.varchar('name', { length: 200 }),
  email: t.varchar('email', { length: 200 }).notNull().unique(),
  normalizedEmail: t.varchar('normalizedEmail', { length: 200 }).unique(),
  updatedAt: t.timestamp('updatedAt', { mode: 'string' }).defaultNow(),
  emailVerified: t.boolean('emailVerified').default(false).notNull(),
  image: t.text('image'),
  createdAt: t.timestamp('createdAt', { mode: 'string' }).defaultNow(),
  role: t.varchar('role').default('user').notNull(),
  banned: t.boolean('banned').default(false).notNull(),
  banReason: t.varchar('banReason'),
  banExpires: t.bigint('banExpires', { mode: 'number' }),
}))

export type UserPrivate = InferSelectModel<typeof user>

export const account = pgTable('account', (t) => ({
  id: t.text('id').primaryKey().notNull(),
  accountId: t.text('accountId').notNull(),
  providerId: t.text('providerId').notNull(),
  userId: t
    .text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: t.text('accessToken'),
  refreshToken: t.text('refreshToken'),
  idToken: t.text('idToken'),
  accessTokenExpiresAt: t.timestamp('accessTokenExpiresAt', { mode: 'string' }),
  refreshTokenExpiresAt: t.timestamp('refreshTokenExpiresAt', { mode: 'string' }),
  scope: t.text('scope'),
  password: t.text('password'),
  createdAt: t.timestamp('createdAt', { mode: 'string' }).notNull(),
  updatedAt: t.timestamp('updatedAt', { mode: 'string' }).notNull(),
}))

export const session = pgTable('session', (t) => ({
  id: t.text('id').primaryKey().notNull(),
  expiresAt: t.timestamp('expiresAt', { mode: 'string' }).notNull(),
  token: t.text('token').notNull(),
  createdAt: t.timestamp('createdAt', { mode: 'string' }).notNull(),
  updatedAt: t.timestamp('updatedAt', { mode: 'string' }).notNull(),
  ipAddress: t.text('ipAddress'),
  userAgent: t.text('userAgent'),
  userId: t
    .text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  impersonatedBy: t.varchar('impersonatedBy'),
}))

export const jwks = pgTable('jwks', (t) => ({
  id: t.text('id').primaryKey().notNull(),
  publicKey: t.text('publicKey').notNull(),
  privateKey: t.text('privateKey').notNull(),
  createdAt: t.timestamp('createdAt', { mode: 'string' }).notNull(),
}))

export const verification = pgTable('verification', (t) => ({
  id: t.text('id').primaryKey().notNull(),
  identifier: t.text('identifier').notNull(),
  value: t.text('value').notNull(),
  expiresAt: t.timestamp('expiresAt', { mode: 'string' }).notNull(),
  createdAt: t.timestamp('createdAt', { mode: 'string' }),
  updatedAt: t.timestamp('updatedAt', { mode: 'string' }),
}))

export const whitelist = pgTable('whitelist', (t) => ({
  id: t.text('id').primaryKey().notNull(),
  email: t.varchar('email', { length: 200 }).notNull().unique(),
  createdAt: t.timestamp('createdAt', { mode: 'string' }).defaultNow(),
}))

// public tables (synced to zero)

import {
  boolean,
  index,
  integer,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core'

export const userPublic = pgTable(
  'userPublic',
  {
    id: text('id').primaryKey(),
    name: text('name'),
    username: text('username'),
    image: text('image'),
    joinedAt: timestamp('joinedAt', { mode: 'string' }).notNull(),
    hasOnboarded: boolean('hasOnboarded').notNull().default(false),
    whitelisted: boolean('whitelisted').notNull().default(false),
    migrationVersion: integer('migrationVersion').notNull().default(0),
    postsCount: integer('postsCount').notNull().default(0),
  },
  (table) => [index('userPublic_username_idx').on(table.username)],
)

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
    createdAt: timestamp('createdAt', { mode: 'string' }).notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }),
  },
  (table) => [
    index('post_userId_idx').on(table.userId),
    index('post_createdAt_idx').on(table.createdAt),
    index('post_createdAt_id_desc_idx').on(table.createdAt, table.id),
  ],
)

export const comment = pgTable(
  'comment',
  {
    id: text('id').primaryKey(),
    postId: text('postId').notNull(),
    userId: text('userId').notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('createdAt', { mode: 'string' }).notNull(),
  },
  (table) => [
    index('comment_postId_idx').on(table.postId),
    index('comment_postId_createdAt_idx').on(table.postId, table.createdAt),
    index('comment_userId_idx').on(table.userId),
  ],
)

export const block = pgTable(
  'block',
  {
    id: text('id').primaryKey(),
    blockerId: text('blockerId').notNull(),
    blockedId: text('blockedId').notNull(),
    createdAt: timestamp('createdAt', { mode: 'string' }).notNull(),
  },
  (table) => [
    unique('block_blocker_blocked_unique').on(table.blockerId, table.blockedId),
    index('block_blockerId_idx').on(table.blockerId),
    index('block_blockedId_idx').on(table.blockedId),
  ],
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
    status: text('status').notNull().default('pending'),
    reviewedBy: text('reviewedBy'),
    reviewedAt: timestamp('reviewedAt', { mode: 'string' }),
    createdAt: timestamp('createdAt', { mode: 'string' }).notNull(),
  },
  (table) => [
    index('report_reporterId_idx').on(table.reporterId),
    index('report_reportedUserId_idx').on(table.reportedUserId),
    index('report_reportedPostId_idx').on(table.reportedPostId),
    index('report_status_idx').on(table.status),
  ],
)

export const device = pgTable(
  'device',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    name: text('name'),
    platform: text('platform').notNull(),
    platformVersion: text('platformVersion'),
    appVersion: text('appVersion'),
    pushToken: text('pushToken'),
    pushEnabled: boolean('pushEnabled').notNull().default(false),
    lastActiveAt: timestamp('lastActiveAt', { mode: 'string' }),
    createdAt: timestamp('createdAt', { mode: 'string' }).notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }),
  },
  (table) => [
    index('device_userId_idx').on(table.userId),
    index('device_pushToken_idx').on(table.pushToken),
  ],
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
    createdAt: timestamp('createdAt', { mode: 'string' }).notNull(),
    expiresAt: timestamp('expiresAt', { mode: 'string' }),
    maxUses: integer('maxUses').notNull().default(1),
    useCount: integer('useCount').notNull().default(0),
  },
  (table) => [
    unique('invite_code_idx').on(table.code),
    index('invite_email_idx').on(table.email),
  ],
)

export const notification = pgTable(
  'notification',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    actorId: text('actorId'),
    type: text('type').notNull(),
    title: text('title'),
    body: text('body'),
    data: text('data'),
    read: boolean('read').notNull().default(false),
    createdAt: timestamp('createdAt', { mode: 'string' }).notNull(),
  },
  (table) => [
    index('notification_userId_idx').on(table.userId),
    index('notification_userId_read_idx').on(table.userId, table.read),
    index('notification_userId_read_createdAt_idx').on(
      table.userId,
      table.read,
      table.createdAt,
    ),
    index('notification_actorId_idx').on(table.actorId),
    index('notification_createdAt_idx').on(table.createdAt),
  ],
)
