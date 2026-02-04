import { relationships } from '@rocicorp/zero'

import * as tables from './generated/tables'

export const userRelationships = relationships(tables.userPublic, ({ many, one }) => ({
  state: one({
    sourceField: ['id'],
    destSchema: tables.userState,
    destField: ['userId'],
  }),
  posts: many({
    sourceField: ['id'],
    destSchema: tables.post,
    destField: ['userId'],
  }),
  blocking: many({
    sourceField: ['id'],
    destSchema: tables.block,
    destField: ['blockerId'],
  }),
  blockedBy: many({
    sourceField: ['id'],
    destSchema: tables.block,
    destField: ['blockedId'],
  }),
  reports: many({
    sourceField: ['id'],
    destSchema: tables.report,
    destField: ['reporterId'],
  }),
  devices: many({
    sourceField: ['id'],
    destSchema: tables.device,
    destField: ['userId'],
  }),
}))

export const postRelationships = relationships(tables.post, ({ one, many }) => ({
  user: one({
    sourceField: ['userId'],
    destSchema: tables.userPublic,
    destField: ['id'],
  }),
  reports: many({
    sourceField: ['id'],
    destSchema: tables.report,
    destField: ['reportedPostId'],
  }),
  comments: many({
    sourceField: ['id'],
    destSchema: tables.comment,
    destField: ['postId'],
  }),
  // enables filtering posts whose author is blocked by viewer
  authorBlockedBy: many({
    sourceField: ['userId'],
    destSchema: tables.block,
    destField: ['blockedId'],
  }),
}))

export const blockRelationships = relationships(tables.block, ({ one }) => ({
  blocker: one({
    sourceField: ['blockerId'],
    destSchema: tables.userPublic,
    destField: ['id'],
  }),
  blocked: one({
    sourceField: ['blockedId'],
    destSchema: tables.userPublic,
    destField: ['id'],
  }),
}))

export const reportRelationships = relationships(tables.report, ({ one }) => ({
  reporter: one({
    sourceField: ['reporterId'],
    destSchema: tables.userPublic,
    destField: ['id'],
  }),
  post: one({
    sourceField: ['reportedPostId'],
    destSchema: tables.post,
    destField: ['id'],
  }),
  reportedUser: one({
    sourceField: ['reportedUserId'],
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

export const userStateRelationships = relationships(tables.userState, ({ one }) => ({
  user: one({
    sourceField: ['userId'],
    destSchema: tables.userPublic,
    destField: ['id'],
  }),
}))

export const commentRelationships = relationships(tables.comment, ({ one }) => ({
  post: one({
    sourceField: ['postId'],
    destSchema: tables.post,
    destField: ['id'],
  }),
  user: one({
    sourceField: ['userId'],
    destSchema: tables.userPublic,
    destField: ['id'],
  }),
}))

export const notificationRelationships = relationships(
  tables.notification,
  ({ one }) => ({
    user: one({
      sourceField: ['userId'],
      destSchema: tables.userPublic,
      destField: ['id'],
    }),
    actor: one({
      sourceField: ['actorId'],
      destSchema: tables.userPublic,
      destField: ['id'],
    }),
  })
)

export const allRelationships = [
  userRelationships,
  postRelationships,
  blockRelationships,
  reportRelationships,
  deviceRelationships,
  userStateRelationships,
  commentRelationships,
  notificationRelationships,
]
