import { relations } from 'drizzle-orm/relations'
import {
  admin,
  block,
  device,
  follows,
  invite,
  like,
  notification,
  post,
  privateBetaInvite,
  report,
  userPublic,
  userState,
  userStats,
} from './schema-public'

export const userPublicRelations = relations(userPublic, ({ one, many }) => ({
  state: one(userState, {
    fields: [userPublic.id],
    references: [userState.userId],
  }),
  stats: one(userStats, {
    fields: [userPublic.id],
    references: [userStats.id],
  }),
  posts: many(post),
  likes: many(like),
  following: many(follows, {
    relationName: 'follower',
  }),
  followers: many(follows, {
    relationName: 'following',
  }),
  blocking: many(block, {
    relationName: 'blocker',
  }),
  blockedBy: many(block, {
    relationName: 'blocked',
  }),
  reports: many(report, {
    relationName: 'reporter',
  }),
  reportedReports: many(report, {
    relationName: 'reported',
  }),
  devices: many(device),
  notifications: many(notification),
  invite: one(invite, {
    fields: [userPublic.id],
    references: [invite.usedBy],
  }),
}))

export const userStateRelations = relations(userState, ({ one }) => ({
  user: one(userPublic, {
    fields: [userState.userId],
    references: [userPublic.id],
  }),
}))

export const userStatsRelations = relations(userStats, ({ one }) => ({
  user: one(userPublic, {
    fields: [userStats.id],
    references: [userPublic.id],
  }),
}))

export const postRelations = relations(post, ({ one, many }) => ({
  user: one(userPublic, {
    fields: [post.userId],
    references: [userPublic.id],
  }),
  likes: many(like),
  reports: many(report),
  notifications: many(notification),
}))

export const likeRelations = relations(like, ({ one }) => ({
  user: one(userPublic, {
    fields: [like.userId],
    references: [userPublic.id],
  }),
  post: one(post, {
    fields: [like.postId],
    references: [post.id],
  }),
}))

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(userPublic, {
    fields: [follows.followerId],
    references: [userPublic.id],
    relationName: 'follower',
  }),
  following: one(userPublic, {
    fields: [follows.followingId],
    references: [userPublic.id],
    relationName: 'following',
  }),
}))

export const blockRelations = relations(block, ({ one }) => ({
  blocker: one(userPublic, {
    fields: [block.blockerId],
    references: [userPublic.id],
    relationName: 'blocker',
  }),
  blocked: one(userPublic, {
    fields: [block.blockedId],
    references: [userPublic.id],
    relationName: 'blocked',
  }),
}))

export const reportRelations = relations(report, ({ one }) => ({
  reporter: one(userPublic, {
    fields: [report.reporterId],
    references: [userPublic.id],
    relationName: 'reporter',
  }),
  reportedUser: one(userPublic, {
    fields: [report.reportedUserId],
    references: [userPublic.id],
    relationName: 'reported',
  }),
  reportedPost: one(post, {
    fields: [report.reportedPostId],
    references: [post.id],
  }),
  reviewer: one(userPublic, {
    fields: [report.reviewedBy],
    references: [userPublic.id],
    relationName: 'reviewer',
  }),
}))

export const deviceRelations = relations(device, ({ one }) => ({
  user: one(userPublic, {
    fields: [device.userId],
    references: [userPublic.id],
  }),
}))

export const inviteRelations = relations(invite, ({ one }) => ({
  usedByUser: one(userPublic, {
    fields: [invite.usedBy],
    references: [userPublic.id],
  }),
  createdByUser: one(userPublic, {
    fields: [invite.createdBy],
    references: [userPublic.id],
  }),
}))

// Alias for compatibility
export const privateBetaInviteRelations = inviteRelations

export const adminRelations = relations(admin, ({ one }) => ({
  // Admin is a separate entity, not directly related to userPublic
  // But could be linked via email if needed
}))

export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(userPublic, {
    fields: [notification.userId],
    references: [userPublic.id],
  }),
  actor: one(userPublic, {
    fields: [notification.actorId],
    references: [userPublic.id],
  }),
  post: one(post, {
    fields: [notification.postId],
    references: [post.id],
  }),
}))
