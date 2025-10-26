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
  likes: many({
    sourceField: ['id'],
    destSchema: tables.like,
    destField: ['userId'],
  }),
  following: many({
    sourceField: ['id'],
    destSchema: tables.follows,
    destField: ['followerId'],
  }),
  followers: many({
    sourceField: ['id'],
    destSchema: tables.follows,
    destField: ['followingId'],
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
  likes: many({
    sourceField: ['id'],
    destSchema: tables.like,
    destField: ['postId'],
  }),
  reports: many({
    sourceField: ['id'],
    destSchema: tables.report,
    destField: ['targetId'],
  }),
}))

export const likeRelationships = relationships(tables.like, ({ one }) => ({
  user: one({
    sourceField: ['userId'],
    destSchema: tables.userPublic,
    destField: ['id'],
  }),
  post: one({
    sourceField: ['postId'],
    destSchema: tables.post,
    destField: ['id'],
  }),
}))

export const followsRelationships = relationships(tables.follows, ({ one }) => ({
  follower: one({
    sourceField: ['followerId'],
    destSchema: tables.userPublic,
    destField: ['id'],
  }),
  following: one({
    sourceField: ['followingId'],
    destSchema: tables.userPublic,
    destField: ['id'],
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
    sourceField: ['targetId'],
    destSchema: tables.post,
    destField: ['id'],
  }),
  reportedUser: one({
    sourceField: ['targetId'],
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
  likeRelationships,
  followsRelationships,
  blockRelationships,
  reportRelationships,
  deviceRelationships,
  userStateRelationships,
  userStatsRelationships,
]
