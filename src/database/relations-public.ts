import { relations } from 'drizzle-orm/relations'

import {
  block,
  device,
  invite,
  post,
  report,
  userPublic,
  userState,
} from './schema-public'

export const userPublicRelations = relations(userPublic, ({ one, many }) => ({
  state: one(userState, {
    fields: [userPublic.id],
    references: [userState.userId],
  }),
  posts: many(post),
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

export const postRelations = relations(post, ({ one, many }) => ({
  user: one(userPublic, {
    fields: [post.userId],
    references: [userPublic.id],
  }),
  reports: many(report),
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
