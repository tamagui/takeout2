import { relationships } from '@rocicorp/zero'
import * as tables from './tables'

export const userRelationships = relationships(tables.userPublic, ({ many, one }) => ({
  servers: many(
    { sourceField: ['id'], destSchema: tables.serverMember, destField: ['userId'] },
    { sourceField: ['serverId'], destSchema: tables.server, destField: ['id'] }
  ),
  server: one(
    { sourceField: ['id'], destSchema: tables.serverMember, destField: ['userId'] },
    { sourceField: ['serverId'], destSchema: tables.server, destField: ['id'] }
  ),
  friends: many(
    { sourceField: ['id'], destSchema: tables.friendship, destField: ['requestingId'] },
    { sourceField: ['acceptingId'], destSchema: tables.userPublic, destField: ['id'] }
  ),
  friendships: many({
    sourceField: ['id'],
    destSchema: tables.friendship,
    destField: ['requestingId'],
  }),
  attachments: many({
    sourceField: ['id'],
    destSchema: tables.attachment,
    destField: ['userId'],
  }),
  roles: many(
    { sourceField: ['id'], destSchema: tables.userRole, destField: ['userId'] },
    { sourceField: ['roleId'], destSchema: tables.role, destField: ['id'] }
  ),
  notifications: many({
    sourceField: ['id'],
    destSchema: tables.notification,
    destField: ['userId'],
  }),
  state: one({
    sourceField: ['id'],
    destSchema: tables.userState,
    destField: ['userId'],
  }),
  indicators: many({
    sourceField: ['id'],
    destSchema: tables.indicator,
    destField: ['userId'],
  }),
  devices: many({
    sourceField: ['id'],
    destSchema: tables.device,
    destField: ['userId'],
  }),
}))

export const userRoleRelationships = relationships(tables.userRole, ({ one }) => ({
  user: one({
    sourceField: ['userId'],
    destSchema: tables.userPublic,
    destField: ['id'],
  }),
  role: one({
    sourceField: ['roleId'],
    destSchema: tables.role,
    destField: ['id'],
  }),
  server: one({
    sourceField: ['serverId'],
    destSchema: tables.server,
    destField: ['id'],
  }),
}))

export const roleRelationships = relationships(tables.role, ({ many, one }) => ({
  members: many(
    { sourceField: ['id'], destSchema: tables.userRole, destField: ['roleId'] },
    { sourceField: ['userId'], destSchema: tables.userPublic, destField: ['id'] }
  ),
  member: one(
    { sourceField: ['id'], destSchema: tables.userRole, destField: ['roleId'] },
    { sourceField: ['userId'], destSchema: tables.userPublic, destField: ['id'] }
  ),
  server: one({
    sourceField: ['serverId'],
    destSchema: tables.server,
    destField: ['id'],
  }),
}))

export const channelPermissionRelationships = relationships(
  tables.channelPermission,
  ({ one }) => ({
    role: one({
      sourceField: ['roleId'],
      destSchema: tables.role,
      destField: ['id'],
    }),
    server: one({
      sourceField: ['serverId'],
      destSchema: tables.server,
      destField: ['id'],
    }),
    channel: one({
      sourceField: ['channelId'],
      destSchema: tables.channel,
      destField: ['id'],
    }),
  })
)

export const pinRelationships = relationships(tables.pin, ({ one }) => ({
  message: one({
    sourceField: ['messageId'],
    destSchema: tables.message,
    destField: ['id'],
  }),
  server: one({
    sourceField: ['serverId'],
    destSchema: tables.server,
    destField: ['id'],
  }),
  channel: one({
    sourceField: ['channelId'],
    destSchema: tables.channel,
    destField: ['id'],
  }),
}))

export const serverRelationships = relationships(tables.server, ({ many, one }) => ({
  channels: many({
    sourceField: ['id'],
    destSchema: tables.channel,
    destField: ['serverId'],
  }),
  channel: one({
    sourceField: ['id'],
    destSchema: tables.channel,
    destField: ['serverId'],
  }),
  members: many(
    { sourceField: ['id'], destSchema: tables.serverMember, destField: ['serverId'] },
    { sourceField: ['userId'], destSchema: tables.userPublic, destField: ['id'] }
  ),
  member: one(
    { sourceField: ['id'], destSchema: tables.serverMember, destField: ['serverId'] },
    { sourceField: ['userId'], destSchema: tables.userPublic, destField: ['id'] }
  ),
  roles: many({
    sourceField: ['id'],
    destSchema: tables.role,
    destField: ['serverId'],
  }),
  role: one({
    sourceField: ['id'],
    destSchema: tables.role,
    destField: ['serverId'],
  }),
  appInstalls: many({
    sourceField: ['id'],
    destSchema: tables.appInstall,
    destField: ['serverId'],
  }),
  apps: many(
    {
      sourceField: ['id'],
      destSchema: tables.appInstall,
      destField: ['serverId'],
    },
    {
      sourceField: ['appId'],
      destSchema: tables.app,
      destField: ['id'],
    }
  ),
  topPrivateChats: many({
    sourceField: ['id'],
    destSchema: tables.privateChatsStats,
    destField: ['serverId'],
  }),
}))

export const appRelationships = relationships(tables.app, ({ one }) => ({
  install: one({
    sourceField: ['id'],
    destSchema: tables.appInstall,
    destField: ['appId'],
  }),

  server: one({
    sourceField: ['serverId'],
    destSchema: tables.server,
    destField: ['id'],
  }),
}))

export const appInstallRelationships = relationships(
  tables.appInstall,
  ({ one, many }) => ({
    app: one({
      sourceField: ['appId'],
      destSchema: tables.app,
      destField: ['id'],
    }),
    data: many({
      sourceField: ['id'],
      destSchema: tables.data,
      destField: ['appInstallId'],
    }),
    appInstallPermissions: many({
      sourceField: ['id'],
      destSchema: tables.appInstallPermission,
      destField: ['appInstallId'],
    }),
    server: one({
      sourceField: ['serverId'],
      destSchema: tables.server,
      destField: ['id'],
    }),
  })
)

export const channelRelationships = relationships(tables.channel, ({ many, one }) => ({
  notifications: many({
    sourceField: ['id'],
    destSchema: tables.notification,
    destField: ['channelId'],
  }),
  messages: many({
    sourceField: ['id'],
    destSchema: tables.message,
    destField: ['channelId'],
  }),
  data: many({
    sourceField: ['id'],
    destSchema: tables.data,
    destField: ['channelId'],
  }),
  threads: many({
    sourceField: ['id'],
    destSchema: tables.thread,
    destField: ['channelId'],
  }),
  pins: many({
    sourceField: ['id'],
    destSchema: tables.pin,
    destField: ['channelId'],
  }),
  roles: many(
    {
      sourceField: ['id'],
      destSchema: tables.channelPermission,
      destField: ['channelId'],
    },
    { sourceField: ['roleId'], destSchema: tables.role, destField: ['id'] }
  ),
  role: one(
    {
      sourceField: ['id'],
      destSchema: tables.channelPermission,
      destField: ['channelId'],
    },
    { sourceField: ['roleId'], destSchema: tables.role, destField: ['id'] }
  ),
  seen: one({
    sourceField: ['id'],
    destSchema: tables.seen,
    destField: ['channelId'],
  }),
  server: one({
    sourceField: ['serverId'],
    destSchema: tables.server,
    destField: ['id'],
  }),
  permissions: many({
    sourceField: ['id'],
    destSchema: tables.channelPermission,
    destField: ['channelId'],
  }),
  appInstalls: many({
    sourceField: ['id'],
    destSchema: tables.appInstall,
    destField: ['channelId'],
  }),
  channelActive: many({
    sourceField: ['id'],
    destSchema: tables.channelActive,
    destField: ['channelId'],
  }),
  meeting: one({
    sourceField: ['id'],
    destSchema: tables.meeting,
    destField: ['channelId'],
  }),
  topics: many({
    sourceField: ['id'],
    destSchema: tables.channelTopic,
    destField: ['channelId'],
  }),
}))

export const channelTopicRelationships = relationships(
  tables.channelTopic,
  ({ many, one }) => ({
    server: one({
      sourceField: ['serverId'],
      destSchema: tables.server,
      destField: ['id'],
    }),
    channel: one({
      sourceField: ['channelId'],
      destSchema: tables.channel,
      destField: ['id'],
    }),
    messages: many(
      {
        sourceField: ['id'],
        destSchema: tables.channelTopicMessage,
        destField: ['topicId'],
      },
      { sourceField: ['messageId'], destSchema: tables.message, destField: ['id'] }
    ),
  })
)

export const channelTopicMessageRelationships = relationships(
  tables.channelTopicMessage,
  ({ one }) => ({
    channel: one({
      sourceField: ['channelId'],
      destSchema: tables.channel,
      destField: ['id'],
    }),
    server: one({
      sourceField: ['serverId'],
      destSchema: tables.server,
      destField: ['id'],
    }),
    topic: one({
      sourceField: ['topicId'],
      destSchema: tables.channelTopic,
      destField: ['id'],
    }),
    message: one({
      sourceField: ['messageId'],
      destSchema: tables.message,
      destField: ['id'],
    }),
  })
)

export const threadRelationships = relationships(tables.thread, ({ many, one }) => ({
  creator: one({
    sourceField: ['creatorId'],
    destSchema: tables.userPublic,
    destField: ['id'],
  }),
  channel: one({
    sourceField: ['channelId'],
    destSchema: tables.channel,
    destField: ['id'],
  }),
  server: one({
    sourceField: ['serverId'],
    destSchema: tables.server,
    destField: ['id'],
  }),
  messages: many({
    sourceField: ['id'],
    destSchema: tables.message,
    destField: ['threadId'],
  }),
  appInstall: one({
    sourceField: ['id'],
    destSchema: tables.appInstall,
    destField: ['threadId'],
  }),
  task: one({
    sourceField: ['id'],
    destSchema: tables.task,
    destField: ['threadId'],
  }),
}))

export const messageReactionRelationships = relationships(
  tables.messageReaction,
  ({ one }) => ({
    message: one({
      sourceField: ['messageId'],
      destSchema: tables.message,
      destField: ['id'],
    }),
    reaction: one({
      sourceField: ['reactionId'],
      destSchema: tables.reaction,
      destField: ['id'],
    }),
    creator: one({
      sourceField: ['creatorId'],
      destSchema: tables.userPublic,
      destField: ['id'],
    }),
    channel: one({
      sourceField: ['channelId'],
      destSchema: tables.channel,
      destField: ['id'],
    }),
    // TODO need to add
    // server: one({
    //   sourceField: ['serverId'],
    //   destSchema: tables.server,
    //   destField: ['id'],
    // }),
  })
)

export const messageRelationships = relationships(tables.message, ({ many, one }) => ({
  pin: one({
    sourceField: ['id'],
    destSchema: tables.pin,
    destField: ['messageId'],
  }),
  thread: one({
    sourceField: ['id'],
    destSchema: tables.thread,
    destField: ['messageId'],
  }),
  channel: one({
    sourceField: ['channelId'],
    destSchema: tables.channel,
    destField: ['id'],
  }),
  server: one({
    sourceField: ['serverId'],
    destSchema: tables.server,
    destField: ['id'],
  }),
  replyingTo: one({
    sourceField: ['replyingToId'],
    destSchema: tables.message,
    destField: ['id'],
  }),
  creator: one({
    sourceField: ['creatorId'],
    destSchema: tables.userPublic,
    destField: ['id'],
  }),
  // get all reactions for this message (for display)
  messageReactions: many({
    sourceField: ['id'],
    destSchema: tables.messageReaction,
    destField: ['messageId'],
  }),
  // get current user's reactions for this message
  currentUserMessageReactions: many({
    sourceField: ['id'],
    destSchema: tables.messageReaction,
    destField: ['messageId'],
  }),
  // get aggregated reaction stats with reaction details
  reactionStats: many({
    sourceField: ['id'],
    destSchema: tables.messageReactionStats,
    destField: ['messageId'],
  }),
  notification: one({
    sourceField: ['id'],
    destSchema: tables.notification,
    destField: ['messageId'],
  }),
  seen: one({
    sourceField: ['id'],
    destSchema: tables.seen,
    destField: ['messageId'],
  }),
  attachments: many({
    sourceField: ['id'],
    destSchema: tables.attachment,
    destField: ['messageId'],
  }),
  appInstall: one({
    sourceField: ['id'],
    destSchema: tables.appInstall,
    destField: ['messageId'],
  }),
  topicMessages: many({
    sourceField: ['id'],
    destSchema: tables.channelTopicMessage,
    destField: ['messageId'],
  }),
  task: one({
    sourceField: ['id'],
    destSchema: tables.task,
    destField: ['messageId'],
  }),
}))

export const notificationRelationships = relationships(
  tables.notification,
  ({ one, many }) => ({
    message: one({
      sourceField: ['messageId'],
      destSchema: tables.message,
      destField: ['id'],
    }),
    messages: many({
      sourceField: ['messageId'],
      destSchema: tables.message,
      destField: ['id'],
    }),
    user: one({
      sourceField: ['userId'],
      destSchema: tables.userPublic,
      destField: ['id'],
    }),
    channel: one({
      sourceField: ['channelId'],
      destSchema: tables.channel,
      destField: ['id'],
    }),
    server: one({
      sourceField: ['serverId'],
      destSchema: tables.server,
      destField: ['id'],
    }),
  })
)

export const appInstallPermissionRelationships = relationships(
  tables.appInstallPermission,
  ({ one }) => ({
    appInstall: one({
      sourceField: ['appInstallId'],
      destSchema: tables.appInstall,
      destField: ['id'],
    }),
    role: one({
      sourceField: ['roleId'],
      destSchema: tables.role,
      destField: ['id'],
    }),
    server: one({
      sourceField: ['serverId'],
      destSchema: tables.server,
      destField: ['id'],
    }),
  })
)

export const indicatorRelationships = relationships(tables.indicator, ({ one }) => ({
  user: one({
    sourceField: ['userId'],
    destSchema: tables.userPublic,
    destField: ['id'],
  }),
  server: one({
    sourceField: ['serverId'],
    destSchema: tables.server,
    destField: ['id'],
  }),
  channel: one({
    sourceField: ['channelId'],
    destSchema: tables.channel,
    destField: ['id'],
  }),
  thread: one({
    sourceField: ['threadId'],
    destSchema: tables.thread,
    destField: ['id'],
  }),
}))

export const messageReactionStatsRelationships = relationships(
  tables.messageReactionStats,
  ({ one }) => ({
    message: one({
      sourceField: ['messageId'],
      destSchema: tables.message,
      destField: ['id'],
    }),
    reaction: one({
      sourceField: ['reactionId'],
      destSchema: tables.reaction,
      destField: ['id'],
    }),
  })
)

export const privateChatsStatsRelationships = relationships(
  tables.privateChatsStats,
  ({ one }) => ({
    userServer: one({
      sourceField: ['userServerId'],
      destSchema: tables.server,
      destField: ['id'],
    }),
    userA: one({
      sourceField: ['userAId'],
      destSchema: tables.userPublic,
      destField: ['id'],
    }),
    userB: one({
      sourceField: ['userBId'],
      destSchema: tables.userPublic,
      destField: ['id'],
    }),
  })
)

export const channelActiveRelationships = relationships(
  tables.channelActive,
  ({ one }) => ({
    user: one({
      sourceField: ['userId'],
      destSchema: tables.userPublic,
      destField: ['id'],
    }),
    channel: one({
      sourceField: ['channelId'],
      destSchema: tables.channel,
      destField: ['id'],
    }),
  })
)

export const meetingRelationships = relationships(tables.meeting, ({ one, many }) => ({
  server: one({
    sourceField: ['serverId'],
    destSchema: tables.server,
    destField: ['id'],
  }),
  channel: one({
    sourceField: ['channelId'],
    destSchema: tables.channel,
    destField: ['id'],
  }),
  meetingUsers: many({
    sourceField: ['id'],
    destSchema: tables.meetingUser,
    destField: ['meetingId'],
  }),
}))

export const meetingUserRelationships = relationships(tables.meetingUser, ({ one }) => ({
  meeting: one({
    sourceField: ['meetingId'],
    destSchema: tables.meeting,
    destField: ['id'],
  }),
  user: one({
    sourceField: ['userId'],
    destSchema: tables.userPublic,
    destField: ['id'],
  }),
}))

export const serverMemberRelationships = relationships(
  tables.serverMember,
  ({ one }) => ({
    server: one({
      sourceField: ['serverId'],
      destSchema: tables.server,
      destField: ['id'],
    }),
    user: one({
      sourceField: ['userId'],
      destSchema: tables.userPublic,
      destField: ['id'],
    }),
  })
)

export const dataRelationships = relationships(tables.data, ({ one }) => ({
  server: one({
    sourceField: ['serverId'],
    destSchema: tables.server,
    destField: ['id'],
  }),
  channel: one({
    sourceField: ['channelId'],
    destSchema: tables.channel,
    destField: ['id'],
  }),
  appInstall: one({
    sourceField: ['appInstallId'],
    destSchema: tables.appInstall,
    destField: ['id'],
  }),
  creator: one({
    sourceField: ['creatorId'],
    destSchema: tables.userPublic,
    destField: ['id'],
  }),
}))

export const deviceRelationships = relationships(tables.device, ({ one }) => ({
  user: one({
    sourceField: ['userId'],
    destSchema: tables.userPublic,
    destField: ['id'],
  }),
}))

export const inviteRelationships = relationships(tables.invite, ({ one }) => ({
  server: one({
    sourceField: ['serverId'],
    destSchema: tables.server,
    destField: ['id'],
  }),
  role: one({
    sourceField: ['roleId'],
    destSchema: tables.role,
    destField: ['id'],
  }),
  inviter: one({
    sourceField: ['inviterId'],
    destSchema: tables.userPublic,
    destField: ['id'],
  }),
  acceptedBy: one({
    sourceField: ['acceptedById'],
    destSchema: tables.userPublic,
    destField: ['id'],
  }),
}))

export const taskRelationships = relationships(tables.task, ({ one, many }) => ({
  run: one({
    sourceField: ['id'],
    destSchema: tables.taskRun,
    destField: ['taskId'],
  }),

  runs: many({
    sourceField: ['id'],
    destSchema: tables.taskRun,
    destField: ['taskId'],
  }),
}))

export const taskRunRelationships = relationships(tables.taskRun, ({ one }) => ({
  creator: one({
    sourceField: ['creatorId'],
    destSchema: tables.userPublic,
    destField: ['id'],
  }),
  task: one({
    sourceField: ['taskId'],
    destSchema: tables.task,
    destField: ['id'],
  }),
}))

export const allRelationships = [
  userRoleRelationships,
  messageReactionRelationships,
  userRelationships,
  roleRelationships,
  channelPermissionRelationships,
  pinRelationships,
  serverRelationships,
  serverMemberRelationships,
  channelRelationships,
  channelTopicRelationships,
  channelTopicMessageRelationships,
  threadRelationships,
  messageRelationships,
  appInstallRelationships,
  appRelationships,
  appInstallPermissionRelationships,
  notificationRelationships,
  indicatorRelationships,
  messageReactionStatsRelationships,
  privateChatsStatsRelationships,
  channelActiveRelationships,
  meetingRelationships,
  meetingUserRelationships,
  dataRelationships,
  deviceRelationships,
  inviteRelationships,
  taskRelationships,
  taskRunRelationships,
]
