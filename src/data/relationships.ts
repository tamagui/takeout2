import { relationships } from '@rocicorp/zero'
import * as tables from './tables'

// User relationships
export const userRelationships = relationships(tables.userPublic, ({ many, one }) => ({
  // User state
  state: one({
    sourceField: ['id'],
    destSchema: tables.userState,
    destField: ['userId'],
  }),
  // User stats
  stats: one({
    sourceField: ['id'],
    destSchema: tables.userStats,
    destField: ['id'],
  }),
  // User's posts
  posts: many({
    sourceField: ['id'],
    destSchema: tables.post,
    destField: ['userId'],
  }),
  // User's likes
  likes: many({
    sourceField: ['id'],
    destSchema: tables.like,
    destField: ['userId'],
  }),
  // Who user is following
  following: many({
    sourceField: ['id'],
    destSchema: tables.follows,
    destField: ['followerId'],
  }),
  // Who is following user
  followers: many({
    sourceField: ['id'],
    destSchema: tables.follows,
    destField: ['followingId'],
  }),
  // Who user is blocking
  blocking: many({
    sourceField: ['id'],
    destSchema: tables.block,
    destField: ['blockerId'],
  }),
  // Who is blocking user
  blockedBy: many({
    sourceField: ['id'],
    destSchema: tables.block,
    destField: ['blockedId'],
  }),
  // User's reports
  reports: many({
    sourceField: ['id'],
    destSchema: tables.report,
    destField: ['reporterId'],
  }),
  // User's devices
  devices: many({
    sourceField: ['id'],
    destSchema: tables.device,
    destField: ['userId'],
  }),
}))

// Post relationships
export const postRelationships = relationships(tables.post, ({ one, many }) => ({
  // Post's author
  user: one({
    sourceField: ['userId'],
    destSchema: tables.userPublic,
    destField: ['id'],
  }),
  // Post's likes
  likes: many({
    sourceField: ['id'],
    destSchema: tables.like,
    destField: ['postId'],
  }),
  // Reports on this post
  reports: many({
    sourceField: ['id'],
    destSchema: tables.report,
    destField: ['targetId'],
  }),
}))

// Like relationships
export const likeRelationships = relationships(tables.like, ({ one }) => ({
  // Like's user
  user: one({
    sourceField: ['userId'],
    destSchema: tables.userPublic,
    destField: ['id'],
  }),
  // Like's post
  post: one({
    sourceField: ['postId'],
    destSchema: tables.post,
    destField: ['id'],
  }),
}))

// Follows relationships
export const followsRelationships = relationships(tables.follows, ({ one }) => ({
  // The follower
  follower: one({
    sourceField: ['followerId'],
    destSchema: tables.userPublic,
    destField: ['id'],
  }),
  // The user being followed
  following: one({
    sourceField: ['followingId'],
    destSchema: tables.userPublic,
    destField: ['id'],
  }),
}))

// Block relationships
export const blockRelationships = relationships(tables.block, ({ one }) => ({
  // The blocker
  blocker: one({
    sourceField: ['blockerId'],
    destSchema: tables.userPublic,
    destField: ['id'],
  }),
  // The user being blocked
  blocked: one({
    sourceField: ['blockedId'],
    destSchema: tables.userPublic,
    destField: ['id'],
  }),
}))

// Report relationships
export const reportRelationships = relationships(tables.report, ({ one }) => ({
  // The reporter
  reporter: one({
    sourceField: ['reporterId'],
    destSchema: tables.userPublic,
    destField: ['id'],
  }),
  // The reported post (if applicable)
  post: one({
    sourceField: ['targetId'],
    destSchema: tables.post,
    destField: ['id'],
  }),
  // The reported user (if applicable)
  reportedUser: one({
    sourceField: ['targetId'],
    destSchema: tables.userPublic,
    destField: ['id'],
  }),
}))

// Device relationships
export const deviceRelationships = relationships(tables.device, ({ one }) => ({
  // Device's user
  user: one({
    sourceField: ['userId'],
    destSchema: tables.userPublic,
    destField: ['id'],
  }),
}))

// User state relationships
export const userStateRelationships = relationships(tables.userState, ({ one }) => ({
  // State's user
  user: one({
    sourceField: ['userId'],
    destSchema: tables.userPublic,
    destField: ['id'],
  }),
}))

// User stats relationships
export const userStatsRelationships = relationships(tables.userStats, ({ one }) => ({
  // Stats' user
  user: one({
    sourceField: ['id'],
    destSchema: tables.userPublic,
    destField: ['id'],
  }),
}))

// Export all relationships
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
