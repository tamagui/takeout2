// ⚠️
// when adding/removing a model:
// add to here and ./tables.ts!

export type { App } from '~/data/models/app'
export type { AppInstall } from '~/data/models/appInstall'
export type { AppInstallPermission } from '~/data/models/appInstallPermission'
export type { Attachment } from '~/data/models/attachment'
export type { Channel } from '~/data/models/channel'
export type { ChannelActive } from '~/data/models/channelActive'
export type { ChannelPermission } from '~/data/models/channelPermission'
export type { ChannelTopic } from '~/data/models/channelTopic'
export type { ChannelTopicMessage } from '~/data/models/channelTopicMessage'
export type { Data } from '~/data/models/data'
export type { Device } from '~/data/models/device'
export type { Friendship } from '~/data/models/friendship'
export type { Indicator } from '~/data/models/indicator'
export type { Invite } from '~/data/models/invite'
export type { Job } from '~/data/models/job'
export type { Meeting } from '~/data/models/meeting'
export type { MeetingUser } from '~/data/models/meetingUser'
export type { Message } from '~/data/models/message'
export type { MessageReaction } from '~/data/models/messageReaction'
export type { MessageReactionStats } from '~/data/models/messageReactionStats'
export type { Notification } from '~/data/models/notification'
export type { Pin } from '~/data/models/pin'
export type { PrivateBetaInvite } from '~/data/models/privateBetaInvite'
export type { PrivateChatsStats } from '~/data/models/privateChatsStats'
export type { Reaction } from '~/data/models/reaction'
export type { Role } from '~/data/models/role'
export type { Seen } from '~/data/models/seen'
export type { Server } from '~/data/models/server'
export type { ServerMember } from '~/data/models/serverMember'
export type { Task } from '~/data/models/task'
export type { TaskRun } from '~/data/models/taskRun'
export type { Thread } from '~/data/models/thread'
export type { User } from '~/data/models/user'
export type { UserRole } from '~/data/models/userRole'
export type { UserState } from '~/data/models/userState'

import * as admin from '~/data/models/admin'
import * as app from '~/data/models/app'
import * as appInstall from '~/data/models/appInstall'
import * as appInstallPermission from '~/data/models/appInstallPermission'
import * as attachment from '~/data/models/attachment'
import * as channel from '~/data/models/channel'
import * as channelActive from '~/data/models/channelActive'
import * as channelPermission from '~/data/models/channelPermission'
import * as channelTopic from '~/data/models/channelTopic'
import * as channelTopicMessage from '~/data/models/channelTopicMessage'
import * as data from '~/data/models/data'
import * as device from '~/data/models/device'
import * as friendship from '~/data/models/friendship'
import * as indicator from '~/data/models/indicator'
import * as invite from '~/data/models/invite'
import * as job from '~/data/models/job'
import * as meeting from '~/data/models/meeting'
import * as meetingUser from '~/data/models/meetingUser'
import * as message from '~/data/models/message'
import * as messageReaction from '~/data/models/messageReaction'
import * as messageReactionStats from '~/data/models/messageReactionStats'
import * as notification from '~/data/models/notification'
import * as pin from '~/data/models/pin'
import * as privateBetaInvite from '~/data/models/privateBetaInvite'
import * as privateChatsStats from '~/data/models/privateChatsStats'
import * as reaction from '~/data/models/reaction'
import * as role from '~/data/models/role'
import * as seen from '~/data/models/seen'
import * as server from '~/data/models/server'
import * as serverMember from '~/data/models/serverMember'
import * as task from '~/data/models/task'
import * as taskRun from '~/data/models/taskRun'
import * as thread from '~/data/models/thread'
import * as userPublic from '~/data/models/user'
import * as userRole from '~/data/models/userRole'
import * as userState from '~/data/models/userState'

export const models = {
  admin,
  app,
  appInstall,
  appInstallPermission,
  attachment,
  channel,
  channelActive,
  channelPermission,
  channelTopic,
  channelTopicMessage,
  data,
  device,
  friendship,
  indicator,
  invite,
  job,
  meeting,
  meetingUser,
  message,
  messageReaction,
  messageReactionStats,
  notification,
  pin,
  privateBetaInvite,
  privateChatsStats,
  reaction,
  role,
  seen,
  server,
  serverMember,
  task,
  taskRun,
  thread,
  userPublic,
  userRole,
  userState,
}
