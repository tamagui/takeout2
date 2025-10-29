import { relationships } from '@rocicorp/zero'
import * as tables from './tables'

export const userRelationships = relationships(tables.userPublic, ({ many, one }) => ({
  state: one({
    sourceField: ['id'],
    destSchema: tables.userState,
    destField: ['userId'],
  }),
  stats: one({
    sourceField: ['id'],
    destSchema: tables.userStats,
    destField: ['id'],
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

export const userStatsRelationships = relationships(tables.userStats, ({ one }) => ({
  user: one({
    sourceField: ['id'],
    destSchema: tables.userPublic,
    destField: ['id'],
  }),
}))

export const allRelationships = [
  userRelationships,
  postRelationships,
  blockRelationships,
  reportRelationships,
  deviceRelationships,
  userStateRelationships,
  userStatsRelationships,
]
