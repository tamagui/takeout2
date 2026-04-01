import { defineRelations } from 'drizzle-orm'
import * as schema from './schema'

export const relations = defineRelations(schema, (r) => ({
  // --- private tables ---

  user: {
    accounts: r.many.account({
      from: r.user.id,
      to: r.account.userId,
    }),
    sessions: r.many.session({
      from: r.user.id,
      to: r.session.userId,
    }),
  },

  account: {
    user: r.one.user({
      from: r.account.userId,
      to: r.user.id,
    }),
  },

  session: {
    user: r.one.user({
      from: r.session.userId,
      to: r.user.id,
    }),
  },

  // --- public tables ---

  userPublic: {
    state: r.one.userState({
      from: r.userPublic.id,
      to: r.userState.userId,
    }),
    posts: r.many.post({
      from: r.userPublic.id,
      to: r.post.userId,
    }),
    blocking: r.many.block({
      from: r.userPublic.id,
      to: r.block.blockerId,
    }),
    blockedBy: r.many.block({
      from: r.userPublic.id,
      to: r.block.blockedId,
    }),
    reports: r.many.report({
      from: r.userPublic.id,
      to: r.report.reporterId,
    }),
    reportedReports: r.many.report({
      from: r.userPublic.id,
      to: r.report.reportedUserId,
    }),
    devices: r.many.device({
      from: r.userPublic.id,
      to: r.device.userId,
    }),
    invite: r.one.invite({
      from: r.userPublic.id,
      to: r.invite.usedBy,
    }),
  },

  userState: {
    user: r.one.userPublic({
      from: r.userState.userId,
      to: r.userPublic.id,
    }),
  },

  post: {
    user: r.one.userPublic({
      from: r.post.userId,
      to: r.userPublic.id,
    }),
    reports: r.many.report({
      from: r.post.id,
      to: r.report.reportedPostId,
    }),
    comments: r.many.comment({
      from: r.post.id,
      to: r.comment.postId,
    }),
    authorBlockedBy: r.many.block({
      from: r.post.userId,
      to: r.block.blockedId,
    }),
  },

  comment: {
    post: r.one.post({
      from: r.comment.postId,
      to: r.post.id,
    }),
    user: r.one.userPublic({
      from: r.comment.userId,
      to: r.userPublic.id,
    }),
  },

  notification: {
    user: r.one.userPublic({
      from: r.notification.userId,
      to: r.userPublic.id,
    }),
    actor: r.one.userPublic({
      from: r.notification.actorId,
      to: r.userPublic.id,
    }),
  },

  block: {
    blocker: r.one.userPublic({
      from: r.block.blockerId,
      to: r.userPublic.id,
    }),
    blocked: r.one.userPublic({
      from: r.block.blockedId,
      to: r.userPublic.id,
    }),
  },

  report: {
    reporter: r.one.userPublic({
      from: r.report.reporterId,
      to: r.userPublic.id,
    }),
    reportedUser: r.one.userPublic({
      from: r.report.reportedUserId,
      to: r.userPublic.id,
    }),
    reportedPost: r.one.post({
      from: r.report.reportedPostId,
      to: r.post.id,
    }),
    reviewer: r.one.userPublic({
      from: r.report.reviewedBy,
      to: r.userPublic.id,
    }),
  },

  device: {
    user: r.one.userPublic({
      from: r.device.userId,
      to: r.userPublic.id,
    }),
  },

  invite: {
    usedByUser: r.one.userPublic({
      from: r.invite.usedBy,
      to: r.userPublic.id,
    }),
    createdByUser: r.one.userPublic({
      from: r.invite.createdBy,
      to: r.userPublic.id,
    }),
  },
}))
