import { sql } from 'drizzle-orm'
import type { AnyPgColumn } from 'drizzle-orm/pg-core'
import { index, pgTable, primaryKey } from 'drizzle-orm/pg-core'
import type {
  AppDataPermission,
  AppInstallSettings,
  AppMeta,
  AppType,
  AttachmentType,
  ChannelSort,
  ChannelsState,
  ChannelStateData,
  DeviceType,
  JobPriority,
  JobStatus,
  NotificationType,
  ServerState,
  TaskRunStatus,
  TaskRunStepsStatus,
  TaskSchedule,
  TaskSteps,
  TaskTrigger,
  TaskTriggerEvent,
  ThreadsState,
  UserSettings,
} from 'start/types'

import { session, user } from './schema-private'

export const app = pgTable('app', (t) => ({
  id: t.varchar().primaryKey(),
  version: t.varchar().notNull().default('0.0.0'),
  name: t.varchar().notNull().default(''),
  installCount: t.integer().default(0),
  meta: t.jsonb().$type<AppMeta>().default({}),
  type: t.varchar().$type<AppType>(),
  serverId: t.varchar().references(() => server.id, { onDelete: 'cascade' }),
  threadId: t.varchar().references(() => thread.id, { onDelete: 'cascade' }),
  creatorId: t
    .varchar()
    .notNull()
    .references(() => userPublic.id, { onDelete: 'cascade' }),
  description: t.varchar().notNull().default(''),
  public: t.boolean().default(false),
  image: t.varchar(),
  source: t.text().notNull().default(''),
  backendSource: t.text(),
  complicationSource: t.text(),
  frontendSource: t.text(),
  updatedAt: t.timestamp({ mode: 'string' }),
  createdAt: t.timestamp({ mode: 'string' }).defaultNow(),
}))

export const appInstall = pgTable(
  'appInstall',
  (t) => ({
    id: t.varchar().primaryKey(),
    settings: t.jsonb().$type<AppInstallSettings>().default({ options: {} }),
    serverId: t
      .varchar()
      .notNull()
      .references(() => server.id, { onDelete: 'cascade' }),
    creatorId: t.varchar().notNull(),
    appId: t
      .varchar()
      .notNull()
      .references(() => app.id, { onDelete: 'cascade' }),

    threadId: t.varchar(),
    messageId: t.varchar(), // the way we open threads with URLs we always pass both threadId and messageId
    channelId: t.varchar(),
    createdAt: t.timestamp({ mode: 'string' }).defaultNow(),
  }),
  (t) => [index('idx_appInstall_server').on(t.serverId)]
)

export const attachment = pgTable('attachment', (t) => ({
  id: t.varchar().primaryKey(),
  uid: t.varchar(),
  userId: t.varchar().references(() => userPublic.id, { onDelete: 'cascade' }),
  messageId: t.varchar().references(() => message.id, { onDelete: 'cascade' }),
  channelId: t.varchar().references(() => channel.id, { onDelete: 'cascade' }),
  createdAt: t.timestamp({ mode: 'string' }).defaultNow(),
  data: t.text(),
  url: t.varchar(),
  thumbnail: t.varchar(),
  name: t.varchar().default(''),
  type: t.varchar().$type<AttachmentType>().notNull(),
  draft: t.boolean(),
  uploadPercent: t.integer().default(0),
  error: t.varchar(),
}))

export const userPublic = pgTable('userPublic', (t) => ({
  id: t.varchar().primaryKey(),
  lastActive: t.timestamp({ mode: 'string' }).defaultNow(),
  createdAt: t.timestamp({ mode: 'string' }).defaultNow(),
  updatedAt: t.timestamp({ mode: 'string' }).defaultNow(),
  name: t.varchar({ length: 255 }).default(''),
  username: t.varchar({ length: 200 }).default(''),
  image: t.text().default(''),
  joinedAt: t.timestamp({ mode: 'string' }).defaultNow(),
  hasOnboarded: t.boolean().default(false).notNull(),
  migrationVersion: t.integer().default(0).notNull(),
}))

export const userState = pgTable('userState', (t) => ({
  id: t.varchar().primaryKey(),
  userId: t.varchar().unique(),
  apiKey: t.varchar().default(''),
  serversSort: t.jsonb().$type<string[]>(),
  activeServer: t.varchar(),
  lastPathname: t.varchar(),
  lastActiveChannel: t.jsonb().$type<Record<string, string>>().default({}),
  channelState: t.jsonb().$type<ChannelsState>(),
  threadState: t.jsonb().$type<ThreadsState>(),
  messageEdits: t.jsonb().$type<[{ id: string; content: string }]>(),
  topReactions: t.jsonb().$type<string[]>().default([]),
  settings: t.jsonb().$type<UserSettings>().default({}),
  createdAt: t.timestamp({ mode: 'string' }).defaultNow(),
  updatedAt: t.timestamp({ mode: 'string' }).defaultNow(),
}))

export const server = pgTable(
  'server',
  (t) => ({
    id: t.varchar().primaryKey(),
    name: t.varchar({ length: 200 }).notNull(),
    domain: t.varchar({ length: 255 }),
    creatorId: t.varchar().references(() => userPublic.id, { onDelete: 'cascade' }),
    userId: t.varchar(),
    serverBotId: t.varchar(),
    description: t.text(),
    channelSort: t.jsonb().$type<ChannelSort>().default([]),
    icon: t.varchar({ length: 255 }),
    isPrivateChat: t.boolean().default(false).notNull(),
    private: t.boolean().default(false).notNull(),
    friendId: t.varchar(),
    updatedAt: t.timestamp({ mode: 'string' }),
    createdAt: t.timestamp({ mode: 'string' }).defaultNow(),
    banner: t.varchar(),
    state: t.jsonb().$type<ServerState>().default({}),
    tint: t.integer(),
  }),
  (t) => [
    // primary index for id lookups (though this should be automatic with primary key)
    index('idx_server_id').on(t.id),
    // index for creator queries
    index('idx_server_creator').on(t.creatorId),
    // index for domain lookups
    index('idx_server_domain').on(t.domain),
    // index for private chat lookups
    index('idx_server_private').on(t.isPrivateChat),
  ]
)

export const serverMember = pgTable(
  'serverMember',
  (t) => ({
    serverId: t
      .varchar()
      .notNull()
      .references(() => server.id, { onDelete: 'cascade' }),
    userId: t
      .varchar()
      .notNull()
      .references(() => userPublic.id, { onDelete: 'cascade' }),
    hasClosedWelcome: t.boolean().default(false).notNull(),
    joinedAt: t.timestamp({ mode: 'string' }).defaultNow(),
  }),
  (t) => [
    primaryKey({ columns: [t.serverId, t.userId] }),
    index('idx_serverMember_server_user').on(t.serverId, t.userId),
  ]
)

export const channel = pgTable(
  'channel',
  (t) => ({
    id: t.varchar().primaryKey(),
    serverId: t.varchar().references(() => server.id, { onDelete: 'cascade' }),
    name: t.varchar({ length: 200 }).notNull(),
    description: t.text(),
    oldestMessageId: t.varchar(), //.references(() => message.id, { onDelete: 'cascade' }),
    private: t.boolean().default(false).notNull(),
    creatorId: t.varchar().references(() => userPublic.id, { onDelete: 'cascade' }),
    updatedAt: t.timestamp({ mode: 'string' }),
    createdAt: t.timestamp({ mode: 'string' }).defaultNow(),
    chatPrompt: t.text(),
    type: t.varchar({ length: 255 }),
    solo: t.boolean().default(false),
    deleted: t.boolean().default(false).notNull(),
    isPrivateChat: t.boolean().default(false).notNull(),
    friendId: t.varchar(),
    latestSearchIndexMessage: t.varchar(),
    readonly: t.boolean().default(false).notNull(),
    state: t.jsonb().$type<ChannelStateData>(),
  }),
  (t) => [
    // sqlite-optimized: id first for primary key lookups, then serverId for filtering
    index('idx_channel_id_server').on(t.id, t.serverId),
    // separate index for server-based queries
    index('idx_channel_server').on(t.serverId, t.deleted),
    // index for creator queries
    index('idx_channel_creator').on(t.creatorId, t.serverId),
    // partial index for active (non-deleted) channels
    index('idx_channel_server_not_deleted')
      .on(t.serverId, t.id)
      .where(sql`${t.deleted} != true`),
  ]
)

export const channelTopic = pgTable(
  'channelTopic',
  (t) => ({
    id: t.varchar().primaryKey(),
    serverId: t.varchar().references(() => server.id, { onDelete: 'cascade' }),
    channelId: t.varchar().references(() => channel.id, { onDelete: 'cascade' }),
    name: t.varchar({ length: 200 }).notNull(),
    count: t.integer().default(0).notNull(),
    createdAt: t.timestamp({ mode: 'string' }).defaultNow(),
    updatedAt: t.timestamp({ mode: 'string' }).defaultNow(),
  }),
  (t) => [
    index('idx_channelTopic_channel').on(t.channelId),
    index('idx_channelTopic_server').on(t.serverId),
    index('idx_channelTopic_created').on(t.channelId, t.createdAt),
    index('idx_channelTopic_server_created').on(t.serverId, t.channelId, t.createdAt),
  ]
)

export const channelTopicMessage = pgTable(
  'channelTopicMessage',
  (t) => ({
    id: t.varchar().primaryKey(),
    serverId: t.varchar().references(() => server.id, { onDelete: 'cascade' }),
    channelId: t.varchar().references(() => channel.id, { onDelete: 'cascade' }),
    topicId: t.varchar().references(() => channelTopic.id, { onDelete: 'cascade' }),
    messageId: t
      .varchar()
      .references((): AnyPgColumn => message.id, { onDelete: 'cascade' }),
    createdAt: t.timestamp({ mode: 'string' }).defaultNow(),
  }),
  (t) => [
    index('idx_channelTopicMessage_topic').on(t.topicId),
    index('idx_channelTopicMessage_message').on(t.messageId),
    index('idx_channelTopicMessage_server').on(t.serverId),
  ]
)

export const thread = pgTable('thread', (t) => ({
  id: t.varchar().primaryKey(),
  channelId: t.varchar().references(() => channel.id, { onDelete: 'cascade' }),
  serverId: t.varchar(),
  messageId: t
    .varchar()
    .references((): AnyPgColumn => message.id, { onDelete: 'cascade' }),
  creatorId: t.varchar().references(() => userPublic.id, { onDelete: 'cascade' }),
  title: t.varchar({ length: 200 }),
  deleted: t.boolean().default(false).notNull(),
  description: t.varchar({ length: 200 }).default(''),
  replyCount: t.integer().default(0).notNull(),
  updatedAt: t.timestamp({ mode: 'string' }),
  createdAt: t.timestamp({ mode: 'string' }).defaultNow(),
}))

export const message = pgTable(
  'message',
  (t) => ({
    id: t.varchar().primaryKey(),
    serverId: t
      .varchar()
      .notNull()
      .references(() => server.id, { onDelete: 'cascade' }),
    channelId: t
      .varchar()
      .notNull()
      .references(() => channel.id, { onDelete: 'cascade' }),
    replyingToId: t
      .varchar()
      .references((): AnyPgColumn => message.id, { onDelete: 'cascade' }),
    threadId: t.varchar().references(() => thread.id, { onDelete: 'cascade' }),
    creatorId: t.varchar().references(() => userPublic.id, { onDelete: 'cascade' }),
    content: t.text().notNull(),
    isThreadReply: t.boolean().default(false).notNull(),
    createdAt: t.timestamp({ mode: 'string' }).defaultNow(),
    updatedAt: t.timestamp({ mode: 'string' }),
    deleted: t.boolean().default(false).notNull(),
    type: t.varchar({ length: 255 }),
    order: t.varchar(),
    summary: t.varchar(),
  }),
  (t) => [
    index('idx_message_channel_filtered').on(
      t.channelId,
      t.deleted,
      t.isThreadReply,
      t.type,
      t.order
    ),
    index('idx_message_thread').on(t.threadId, t.deleted, t.order, t.type),
    index('idx_message_creator').on(t.creatorId, t.channelId, t.deleted, t.order, t.type),
    index('idx_message_server').on(t.serverId, t.channelId, t.deleted, t.order, t.type),
  ]
)

export const data = pgTable('data', (t) => ({
  id: t.varchar().primaryKey(),
  serverId: t
    .varchar()
    .notNull()
    .references(() => server.id, { onDelete: 'cascade' }),
  channelId: t.varchar().references(() => channel.id, { onDelete: 'cascade' }),
  appId: t.varchar().references(() => app.id, { onDelete: 'cascade' }),
  appInstallId: t.varchar().references(() => appInstall.id, { onDelete: 'cascade' }),
  creatorId: t.varchar().references(() => userPublic.id, { onDelete: 'cascade' }),
  title: t.text(),
  category: t.varchar(),
  status: t.varchar(),
  key: t.varchar().notNull(),
  value: t.text().notNull(),
  reliability: t.integer().default(1),
  createdAt: t.timestamp({ mode: 'string' }).defaultNow(),
  updatedAt: t.timestamp({ mode: 'string' }),
  type: t.varchar({ length: 255 }),
  permissions: t.varchar().$type<AppDataPermission>(),
}))

export const reaction = pgTable('reaction', (t) => ({
  id: t.varchar().primaryKey(),
  value: t.varchar().unique(),
  keyword: t.varchar().unique(),
  createdAt: t.timestamp({ mode: 'string' }).defaultNow(),
  updatedAt: t.timestamp({ mode: 'string' }),
  category: t.varchar(),
  image: t.varchar(),
  keywords: t.jsonb().$type<string[]>().default([]),
}))

export const messageReaction = pgTable(
  'messageReaction',
  (t) => ({
    messageId: t
      .varchar()
      .notNull()
      .references(() => message.id, { onDelete: 'cascade' }),
    creatorId: t
      .varchar()
      .notNull()
      .references(() => userPublic.id, { onDelete: 'cascade' }),
    reactionId: t
      .varchar()
      .notNull()
      .references(() => reaction.id, { onDelete: 'cascade' }),
    createdAt: t.timestamp({ mode: 'string' }).defaultNow(),
    updatedAt: t.timestamp({ mode: 'string' }),
    channelId: t.varchar().references(() => channel.id, { onDelete: 'cascade' }),
  }),
  (t) => [
    primaryKey({ columns: [t.messageId, t.creatorId, t.reactionId] }),
    // index for creator-based queries
    index('idx_messageReaction_creator').on(t.creatorId, t.messageId, t.reactionId),
    // index for message-based queries
    index('idx_messageReaction_message').on(t.messageId, t.creatorId),
    // index for channel-based queries
    index('idx_messageReaction_channel').on(t.channelId, t.creatorId),
  ]
)

export const role = pgTable('role', (t) => ({
  id: t.varchar().primaryKey(),
  serverId: t.varchar().references(() => server.id, { onDelete: 'cascade' }),
  creatorId: t.varchar().references(() => userPublic.id, { onDelete: 'cascade' }),
  name: t.varchar({ length: 200 }).notNull(),
  color: t.varchar({ length: 200 }).notNull(),
  canAdmin: t.boolean().default(false).notNull(),
  canEditServer: t.boolean().default(false).notNull(),
  canEditChannel: t.boolean().default(false).notNull(),
  canEditApp: t.boolean().default(false).notNull(),
  updatedAt: t.timestamp({ mode: 'string' }),
  createdAt: t.timestamp({ mode: 'string' }).defaultNow(),
  image: t.varchar(),
  order: t.integer().default(0).notNull(),
}))

export const userRole = pgTable(
  'userRole',
  (t) => ({
    serverId: t
      .varchar()
      .notNull()
      .references(() => server.id, { onDelete: 'cascade' }),
    userId: t
      .varchar()
      .notNull()
      .references(() => userPublic.id, { onDelete: 'cascade' }),
    roleId: t
      .varchar()
      .notNull()
      .references(() => role.id, { onDelete: 'cascade' }),
    granterId: t.varchar().references(() => userPublic.id),
    createdAt: t.timestamp({ mode: 'string' }).defaultNow(),
  }),
  (t) => [primaryKey({ columns: [t.serverId, t.userId, t.roleId] })]
)

export const channelPermission = pgTable('channelPermission', (t) => ({
  id: t.varchar().primaryKey(),
  channelId: t.varchar().references(() => channel.id, { onDelete: 'cascade' }),
  serverId: t.varchar().references(() => server.id, { onDelete: 'cascade' }),
  roleId: t.varchar().references(() => role.id),
  granterId: t.varchar().references(() => userPublic.id),
  createdAt: t.timestamp({ mode: 'string' }).defaultNow(),
}))

export const appInstallPermission = pgTable('appInstallPermission', (t) => ({
  id: t.varchar().primaryKey(),
  appInstallId: t.varchar().references(() => appInstall.id, { onDelete: 'cascade' }),
  serverId: t.varchar().references(() => server.id, { onDelete: 'cascade' }),
  roleId: t.varchar().references(() => role.id, { onDelete: 'cascade' }),
  granterId: t.varchar().references(() => userPublic.id),
  createdAt: t.timestamp({ mode: 'string' }).defaultNow(),
}))

export const friendship = pgTable(
  'friendship',
  (t) => ({
    requestingId: t
      .varchar()
      .notNull()
      .references(() => userPublic.id, { onDelete: 'cascade' }),
    acceptingId: t
      .varchar()
      .notNull()
      .references(() => userPublic.id, { onDelete: 'cascade' }),
    accepted: t.boolean().default(false).notNull(),
    createdAt: t.timestamp({ mode: 'string' }).defaultNow(),
  }),
  (t) => [primaryKey({ columns: [t.requestingId, t.acceptingId] })]
)

export const pin = pgTable('pin', (t) => ({
  id: t.varchar().primaryKey(),
  channelId: t.varchar().references(() => channel.id, { onDelete: 'cascade' }),
  serverId: t.varchar().references(() => server.id, { onDelete: 'cascade' }),
  messageId: t.varchar().references(() => message.id, { onDelete: 'cascade' }),
  creatorId: t.varchar().references(() => userPublic.id, { onDelete: 'cascade' }),
  createdAt: t.timestamp({ mode: 'string' }).defaultNow(),
}))

export const seen = pgTable(
  'seen',
  (t) => ({
    id: t.varchar().primaryKey(),
    userId: t.varchar().notNull(),
    messageId: t.varchar(),
    channelId: t.varchar(),
    seenAt: t.timestamp({ mode: 'string' }).defaultNow(),
  }),
  (t) => [index('seen_user_channel_idx').on(t.userId, t.channelId)]
)

export const notification = pgTable(
  'notification',
  (t) => ({
    id: t.varchar().primaryKey(),
    userId: t.varchar().notNull(),
    type: t.varchar().$type<NotificationType>(),
    fromUserId: t.varchar(),
    messageId: t.varchar(),
    channelId: t.varchar(),
    serverId: t.varchar(),
    seenAt: t.timestamp({ mode: 'string' }),
    createdAt: t.timestamp({ mode: 'string' }).defaultNow(),
  }),
  (t) => [
    index('idx_notification_user_unseen')
      .on(t.userId, t.channelId)
      .where(sql`"seenAt" IS NULL`),
  ]
)

export const indicator = pgTable('indicator', (t) => ({
  id: t.varchar().primaryKey(),
  type: t.varchar().default('typing').notNull(),
  serverId: t.varchar(),
  channelId: t.varchar(),
  threadId: t.varchar(),
  userId: t
    .varchar()
    .notNull()
    .references(() => userPublic.id, { onDelete: 'cascade' }),
  lastActiveAt: t.timestamp({ mode: 'string' }).defaultNow().notNull(),
}))

export const channelActive = pgTable(
  'channelActive',
  (t) => ({
    userId: t
      .varchar()
      .notNull()
      .references(() => userPublic.id, { onDelete: 'cascade' }),
    channelId: t
      .varchar()
      .notNull()
      .references(() => channel.id, { onDelete: 'cascade' }),
    lastSeenAt: t.timestamp({ mode: 'string' }).defaultNow().notNull(),
    hasAudio: t.boolean(),
    hasVideo: t.boolean(),
  }),
  (t) => [
    primaryKey({ columns: [t.userId, t.channelId] }),
    index('idx_channelActive_channel').on(t.channelId, t.lastSeenAt),
    index('idx_channelActive_channel_user').on(t.channelId, t.userId),
  ]
)

export const meeting = pgTable(
  'meeting',
  (t) => ({
    id: t.varchar().primaryKey(),
    serverId: t
      .varchar()
      .notNull()
      .references(() => server.id, { onDelete: 'cascade' }),
    channelId: t
      .varchar()
      .notNull()
      .references(() => channel.id, { onDelete: 'cascade' }),
    creatorId: t
      .varchar()
      .notNull()
      .references(() => userPublic.id, { onDelete: 'cascade' }),
    cloudflareId: t.varchar().notNull().unique(),
    authToken: t.text(),
    active: t.boolean().default(true).notNull(),
    createdAt: t.timestamp({ mode: 'string' }).defaultNow(),
    updatedAt: t.timestamp({ mode: 'string' }).defaultNow(),
  }),
  (t) => [
    index('idx_meeting_channel').on(t.channelId, t.active),
    index('idx_meeting_server').on(t.serverId, t.active),
    index('idx_meeting_channel_active').on(t.channelId, t.id).where(sql`"active" = true`),
  ]
)

export const meetingUser = pgTable(
  'meetingUser',
  (t) => ({
    meetingId: t
      .varchar()
      .notNull()
      .references(() => meeting.id, { onDelete: 'cascade' }),
    userId: t
      .varchar()
      .notNull()
      .references(() => userPublic.id, { onDelete: 'cascade' }),
    participantToken: t.text(),
    joinedAt: t.timestamp({ mode: 'string' }).defaultNow(),
    leftAt: t.timestamp({ mode: 'string' }),
    active: t.boolean().default(true).notNull(),
  }),
  (t) => [
    primaryKey({ columns: [t.meetingId, t.userId] }),
    index('idx_meetingUser_meeting').on(t.meetingId, t.active),
    index('idx_meetingUser_user').on(t.userId, t.active),
  ]
)

export const device = pgTable(
  'device',
  (t) => ({
    id: t.varchar().primaryKey(),
    userId: t
      .varchar()
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    sessionId: t
      .varchar()
      .notNull()
      .references(() => session.id, { onDelete: 'cascade' }),
    type: t.varchar().$type<DeviceType>().notNull(),
    name: t.text(),
    appBundleId: t.varchar().notNull(),
    deviceToken: t.text().notNull(),
    brand: t.text(),
    model: t.text(),
    createdAt: t.timestamp({ mode: 'string' }).defaultNow().notNull(),
    updatedAt: t.timestamp({ mode: 'string' }),
  }),
  (t) => [
    index('idx_device_user').on(t.userId),
    index('idx_device_session').on(t.sessionId),
    index('idx_device_type').on(t.type),
    index('idx_device_appBundleId').on(t.appBundleId),
    index('idx_device_deviceToken').on(t.deviceToken),
  ]
)

export const invite = pgTable(
  'invite',
  (t) => ({
    id: t.varchar().primaryKey(),
    email: t.varchar().notNull(),
    serverId: t
      .varchar()
      .notNull()
      .references(() => server.id, { onDelete: 'cascade' }),
    roleId: t.varchar().references(() => role.id, { onDelete: 'set null' }),
    inviterId: t
      .varchar()
      .notNull()
      .references(() => userPublic.id, { onDelete: 'cascade' }),
    accepted: t.boolean().default(false).notNull(),
    acceptedAt: t.timestamp({ mode: 'string' }),
    acceptedById: t.varchar().references(() => userPublic.id, { onDelete: 'set null' }),
    expiresAt: t.timestamp({ mode: 'string' }).notNull(),
    createdAt: t.timestamp({ mode: 'string' }).notNull(),
    updatedAt: t.timestamp({ mode: 'string' }),
  }),
  (t) => [
    index('idx_invite_email').on(t.email),
    index('idx_invite_server').on(t.serverId),
    index('idx_invite_role').on(t.roleId),
    index('idx_invite_inviter').on(t.inviterId),
    index('idx_invite_accepted').on(t.accepted),
    index('idx_invite_expires').on(t.expiresAt),
  ]
)

export const privateBetaInvite = pgTable(
  'privateBetaInvite',
  (t) => ({
    id: t.varchar().primaryKey(),
    email: t.varchar().notNull(),
    accepted: t.boolean().default(false).notNull(),
    createdAt: t.timestamp({ mode: 'string' }).notNull(),
    updatedAt: t.timestamp({ mode: 'string' }),
  }),
  (t) => [index('idx_privateBetaInvite_email').on(t.email)]
)

export const task = pgTable('task', (t) => ({
  id: t.varchar().primaryKey(),
  appInstallId: t.varchar().references(() => appInstall.id, { onDelete: 'cascade' }),
  name: t.varchar(),
  // we want to upgrade the base llm over time but not break tasks
  version: t.integer().default(0),
  channelId: t.varchar(),
  messageId: t.varchar(),
  creatorId: t.varchar().references(() => userPublic.id, { onDelete: 'cascade' }),
  description: t.text(),
  schedule: t.jsonb().$type<TaskSchedule>(),
  serverId: t
    .varchar()
    .notNull()
    .references(() => server.id, { onDelete: 'cascade' }),
  steps: t.jsonb().$type<TaskSteps>(),
  numSteps: t.integer().default(0),
  threadId: t.varchar(),
  trigger: t.varchar().$type<TaskTrigger>(),
  triggerEvent: t.varchar().$type<TaskTriggerEvent>(),
  triggerEventAppId: t.varchar(),
  createdAt: t.timestamp({ mode: 'string' }),
  updatedAt: t.timestamp({ mode: 'string' }).defaultNow(),
}))

export const taskRun = pgTable('taskRun', (t) => ({
  id: t.varchar().primaryKey(),
  taskId: t.varchar().references(() => task.id, { onDelete: 'cascade' }),
  creatorId: t.varchar().references(() => userPublic.id, { onDelete: 'cascade' }),
  logs: t.text(),
  serverId: t
    .varchar()
    .notNull()
    .references(() => server.id, { onDelete: 'cascade' }),
  status: t.varchar().$type<TaskRunStatus>(),
  stepsStatus: t.jsonb().$type<TaskRunStepsStatus>(),
  output: t.text(),
  error: t.text(),
  createdAt: t.timestamp({ mode: 'string' }),
  updatedAt: t.timestamp({ mode: 'string' }).defaultNow(),
}))

export const job = pgTable(
  'job',
  (t) => ({
    id: t.varchar().primaryKey(),
    name: t.varchar().notNull(),
    version: t.integer().notNull().default(1),
    status: t.varchar().$type<JobStatus>().notNull().default('pending'),
    priority: t.varchar().$type<JobPriority>().notNull().default('normal'),
    payload: t.jsonb().default({}),
    result: t.jsonb(),
    logs: t.text(),
    error: t.text(),
    progress: t.integer().default(0),
    maxRetries: t.integer().default(3),
    retryCount: t.integer().default(0),
    scheduledFor: t.timestamp({ mode: 'string' }),
    startedAt: t.timestamp({ mode: 'string' }),
    completedAt: t.timestamp({ mode: 'string' }),
    createdAt: t.timestamp({ mode: 'string' }).defaultNow(),
    updatedAt: t.timestamp({ mode: 'string' }).defaultNow(),
  }),
  (t) => [
    index('idx_job_status').on(t.status),
    index('idx_job_name').on(t.name),
    index('idx_job_created').on(t.createdAt),
    index('idx_job_status_priority').on(t.status, t.priority),
  ]
)
