import type {
  App,
  AppInstall,
  AppInstallPermission,
  Attachment,
  Channel,
  ChannelActive,
  ChannelPermission,
  ChannelTopic,
  Meeting,
  MeetingUser,
  Message,
  MessageReaction,
  MessageReactionStats,
  Notification,
  Pin,
  Reaction,
  Role,
  Seen,
  Server,
  Task,
  TaskRun,
  Thread,
  User,
} from '~/data/models'

export type * from './models'

export type MessageUpdate = Partial<Message> & {
  id: string
  // things needed by message side effects
  serverId: string
  channelId: string
  creatorId: string
  createdAt: number
  content: string
}
export type SeenUpdate = Partial<Seen> & { id: string }

const rolePermissionsKeys = [
  'canAdmin',
  'canEditChannel',
  'canEditServer',
] satisfies (keyof Role)[]

export type RolePermissionsKeys = (typeof rolePermissionsKeys)[number]

export type UserWithRoles = User & {
  roles?: readonly Role[]
}

export type DraftMessage = Message & {
  attachments?: readonly Attachment[]
}

export type SendMessage = DraftMessage & {
  nextDraftId: string
}

export type MessageMinimal = Message & {
  creator?: User
  reactionStats?: readonly MessageReactionStatsWithReactions[]
  replyingTo?: Message & { creator?: User }
  attachments?: readonly Attachment[]
  notification?: Notification
}

// how we get it from db
export type MessageReactionWithUserReaction = MessageReaction & {
  reaction?: Reaction
}

// how we normalize it
export type ReactionWithUserMessageReaction = Reaction & {
  userReaction?: MessageReaction
}

export type TaskWithRelations = Task & {
  run?: TaskRun
}

export type MessageWithRelations = Message & {
  pin?: Pin
  channel?: Channel
  thread?: Thread & {
    appInstalls?: AppInstallWithRelations
  }
  creator?: UserWithRoles
  replyingTo?: Message & { creator?: User }
  attachments?: readonly Attachment[]
  notification?: Notification
  currentUserMessageReactions?: readonly MessageReactionWithUserReaction[]
  reactionStats?: readonly MessageReactionStatsWithReactions[]
  appInstall?: AppInstallWithRelations
  task?: Task
}

export type MessageReactionStatsWithReactions = MessageReactionStats & {
  reaction?: Reaction
}

export type NotificationFriendship = Omit<Notification, 'type'> & {
  type: 'friendship'
}

export type NotificationMessage = Omit<Notification, 'type'> & {
  type: 'message'
  messageId: string
  channelId: string
  serverId: string
}

export type NotificationMessageWithRelations = NotificationMessage & {
  messages?: readonly MessageWithRelations[]
}

export type ChannelWithMessagesWithRelations = Channel & {
  messages?: readonly MessageWithRelations[]
}

export type UserWithState = User & {
  roles?: readonly Role[]
}
export type ThreadWithRelations = Thread & {
  app?: App
  messages?: readonly Message[]
}

export type RoleWithRelations = Role & { members: readonly User[] }

export type AppInstallWithRelations = AppInstall & {
  app?: App
  appInstallPermissions?: readonly AppInstallPermission[]
}

export type AppWithRelations = App & {
  install?: AppInstall & {
    appInstallPermissions?: readonly AppInstallPermission[]
  }
}

export type MeetingWithRelations = Meeting & {
  meetingUsers?: readonly (MeetingUser & { user?: User })[]
}

export type ChannelWithRelations = Channel & {
  appInstalls?: readonly AppInstallWithRelations[]
  permissions?: readonly (ChannelPermission & { role?: Role })[]
  notifications?: readonly Notification[]
  channelActive?: readonly (ChannelActive & { user?: User })[]
  meeting?: MeetingWithRelations
  topics?: readonly ChannelTopic[]
}

export type ServerWithRelations = Server & {
  apps?: readonly (App & { install?: AppInstall })[]
  members?: readonly User[]
  member?: User
  roles?: readonly Role[]
  channel?: ChannelWithRelations
}

export type ServerWithMembership = Server & {
  member?: User
}
