import { relations } from 'drizzle-orm/relations'
import {
  app,
  appInstall,
  appInstallPermission,
  attachment,
  channel,
  channelPermission,
  friendship,
  indicator,
  message,
  messageReaction,
  notification,
  pin,
  reaction,
  role,
  seen,
  server,
  serverMember,
  thread,
  userPublic,
  userRole,
} from './schema-public'

export const userPublicRelations = relations(userPublic, ({ many }) => ({
  channelPermissions: many(channelPermission),
  threads: many(thread),
  pins: many(pin),
  attachments: many(attachment),
  roles: many(role),
  messages: many(message),
  servers: many(server),
  friendships_requestingId: many(friendship, {
    relationName: 'friend_requests_sent',
  }),
  friendships_acceptingId: many(friendship, {
    relationName: 'friend_requests_received',
  }),
  serverMembers: many(serverMember),
  userRoles_userId: many(userRole, {
    relationName: 'assigned_roles',
  }),
  userRoles_granterId: many(userRole, {
    relationName: 'granted_roles',
  }),
  messageReactions: many(messageReaction),
  indicators: many(indicator),
}))

export const serverRelations = relations(server, ({ one, many }) => ({
  channelPermissions: many(channelPermission),
  appInstallPermissions: many(appInstallPermission),
  pins: many(pin),
  roles: many(role),
  messages: many(message),
  channels: many(channel),
  creator: one(userPublic, {
    fields: [server.creatorId],
    references: [userPublic.id],
  }),
  serverMembers: many(serverMember),
  userRoles: many(userRole),
  appInstalls: many(appInstall),
}))

export const channelRelations = relations(channel, ({ one, many }) => ({
  channelPermissions: many(channelPermission),
  threads: many(thread),
  pins: many(pin),
  attachments: many(attachment),
  messages: many(message),
  server: one(server, {
    fields: [channel.serverId],
    references: [server.id],
  }),
}))

export const threadRelations = relations(thread, ({ one, many }) => ({
  channel: one(channel, {
    fields: [thread.channelId],
    references: [channel.id],
  }),
  creator: one(userPublic, {
    fields: [thread.creatorId],
    references: [userPublic.id],
  }),
  messages: many(message),
}))

export const messageRelations = relations(message, ({ one, many }) => ({
  pins: many(pin),
  attachments: many(attachment),
  server: one(server, {
    fields: [message.serverId],
    references: [server.id],
  }),
  channel: one(channel, {
    fields: [message.channelId],
    references: [channel.id],
  }),
  thread: one(thread, {
    fields: [message.threadId],
    references: [thread.id],
  }),
  creator: one(userPublic, {
    fields: [message.creatorId],
    references: [userPublic.id],
  }),
  messageReactions: many(messageReaction),
  replyingTo: one(message, {
    fields: [message.replyingToId],
    references: [message.id],
    relationName: 'message_replies',
  }),
  replies: many(message, {
    relationName: 'message_replies',
  }),
  childThread: many(thread),
}))

export const attachmentRelations = relations(attachment, ({ one }) => ({
  message: one(message, {
    fields: [attachment.messageId],
    references: [message.id],
  }),
  channel: one(channel, {
    fields: [attachment.channelId],
    references: [channel.id],
  }),
  user: one(userPublic, {
    fields: [attachment.userId],
    references: [userPublic.id],
  }),
}))

export const roleRelations = relations(role, ({ one, many }) => ({
  channelPermissions: many(channelPermission),
  appInstallPermissions: many(appInstallPermission),
  server: one(server, {
    fields: [role.serverId],
    references: [server.id],
  }),
  creator: one(userPublic, {
    fields: [role.creatorId],
    references: [userPublic.id],
  }),
  userRoles: many(userRole),
}))

export const channelPermissionRelations = relations(channelPermission, ({ one }) => ({
  channel: one(channel, {
    fields: [channelPermission.channelId],
    references: [channel.id],
  }),
  server: one(server, {
    fields: [channelPermission.serverId],
    references: [server.id],
  }),
  role: one(role, {
    fields: [channelPermission.roleId],
    references: [role.id],
  }),
  granter: one(userPublic, {
    fields: [channelPermission.granterId],
    references: [userPublic.id],
  }),
}))

export const pinRelations = relations(pin, ({ one }) => ({
  channel: one(channel, {
    fields: [pin.channelId],
    references: [channel.id],
  }),
  server: one(server, {
    fields: [pin.serverId],
    references: [server.id],
  }),
  message: one(message, {
    fields: [pin.messageId],
    references: [message.id],
  }),
  creator: one(userPublic, {
    fields: [pin.creatorId],
    references: [userPublic.id],
  }),
}))

export const friendshipRelations = relations(friendship, ({ one }) => ({
  requesting: one(userPublic, {
    fields: [friendship.requestingId],
    references: [userPublic.id],
    relationName: 'friend_requests_sent',
  }),
  accepting: one(userPublic, {
    fields: [friendship.acceptingId],
    references: [userPublic.id],
    relationName: 'friend_requests_received',
  }),
}))

export const serverMemberRelations = relations(serverMember, ({ one }) => ({
  server: one(server, {
    fields: [serverMember.serverId],
    references: [server.id],
  }),
  user: one(userPublic, {
    fields: [serverMember.userId],
    references: [userPublic.id],
  }),
}))

export const userRoleRelations = relations(userRole, ({ one }) => ({
  server: one(server, {
    fields: [userRole.serverId],
    references: [server.id],
  }),
  role: one(role, {
    fields: [userRole.roleId],
    references: [role.id],
  }),
  user: one(userPublic, {
    fields: [userRole.userId],
    references: [userPublic.id],
    relationName: 'assigned_roles',
  }),
  granter: one(userPublic, {
    fields: [userRole.granterId],
    references: [userPublic.id],
    relationName: 'granted_roles',
  }),
}))

export const messageReactionRelations = relations(messageReaction, ({ one }) => ({
  message: one(message, {
    fields: [messageReaction.messageId],
    references: [message.id],
  }),
  reaction: one(reaction, {
    fields: [messageReaction.reactionId],
    references: [reaction.id],
  }),
  creator: one(userPublic, {
    fields: [messageReaction.creatorId],
    references: [userPublic.id],
  }),
  channel: one(channel, {
    fields: [messageReaction.channelId],
    references: [channel.id],
  }),
}))

export const reactionRelations = relations(reaction, ({ many }) => ({
  messageReactions: many(messageReaction),
}))

export const seenRelations = relations(seen, ({ one }) => ({
  message: one(message, {
    fields: [seen.messageId],
    references: [message.id],
  }),
  channel: one(channel, {
    fields: [seen.channelId],
    references: [channel.id],
  }),
}))

export const notificationRelations = relations(notification, ({ one }) => ({
  message: one(message, {
    fields: [notification.messageId],
    references: [message.id],
  }),
  channel: one(channel, {
    fields: [notification.channelId],
    references: [channel.id],
  }),
  server: one(server, {
    fields: [notification.serverId],
    references: [server.id],
  }),
  user: one(userPublic, {
    fields: [notification.userId],
    references: [userPublic.id],
  }),
}))

export const appRelations = relations(app, ({ one, many }) => ({
  creator: one(userPublic, {
    fields: [app.creatorId],
    references: [userPublic.id],
  }),
  appInstalls: many(appInstall),
}))

export const appInstallRelations = relations(appInstall, ({ one, many }) => ({
  app: one(app, {
    fields: [appInstall.appId],
    references: [app.id],
  }),
  server: one(server, {
    fields: [appInstall.serverId],
    references: [server.id],
  }),
  appInstallPermissions: many(appInstallPermission),
}))

export const appInstallPermissionRelations = relations(
  appInstallPermission,
  ({ one }) => ({
    appInstall: one(appInstall, {
      fields: [appInstallPermission.appInstallId],
      references: [appInstall.id],
    }),
    server: one(server, {
      fields: [appInstallPermission.serverId],
      references: [server.id],
    }),
    role: one(role, {
      fields: [appInstallPermission.roleId],
      references: [role.id],
    }),
    granter: one(userPublic, {
      fields: [appInstallPermission.granterId],
      references: [userPublic.id],
    }),
  })
)

export const indicatorRelations = relations(indicator, ({ one }) => ({
  user: one(userPublic, {
    fields: [indicator.userId],
    references: [userPublic.id],
  }),
  server: one(server, {
    fields: [indicator.serverId],
    references: [server.id],
  }),
  channel: one(channel, {
    fields: [indicator.channelId],
    references: [channel.id],
  }),
  thread: one(thread, {
    fields: [indicator.threadId],
    references: [thread.id],
  }),
}))
