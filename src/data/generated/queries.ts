import * as v from 'valibot'
import { syncedQuery } from '@rocicorp/zero'
import * as blockQueries from '../queries/block'
import * as postQueries from '../queries/post'
import * as userQueries from '../queries/user'

export const allPosts = syncedQuery(
  'allPosts',
  v.parser(
    v.tuple([
      v.object({
        limit: v.optional(v.number()),
      }),
    ])
  ),
  (arg) => {
    return postQueries.allPosts(arg)
  }
)

export const blockedByUser = syncedQuery(
  'blockedByUser',
  v.parser(
    v.tuple([
      v.object({
        userId: v.string(),
        limit: v.optional(v.number()),
      }),
    ])
  ),
  (arg) => {
    return blockQueries.blockedByUser(arg)
  }
)

export const postById = syncedQuery(
  'postById',
  v.parser(
    v.tuple([
      v.object({
        postId: v.string(),
      }),
    ])
  ),
  (arg) => {
    return postQueries.postById(arg)
  }
)

export const postsByUserId = syncedQuery(
  'postsByUserId',
  v.parser(
    v.tuple([
      v.object({
        userId: v.string(),
        limit: v.optional(v.number()),
      }),
    ])
  ),
  (arg) => {
    return postQueries.postsByUserId(arg)
  }
)

export const userById = syncedQuery(
  'userById',
  v.parser(
    v.tuple([
      v.object({
        userId: v.string(),
      }),
    ])
  ),
  (arg) => {
    return userQueries.userById(arg)
  }
)

export const userByUsername = syncedQuery(
  'userByUsername',
  v.parser(
    v.tuple([
      v.object({
        username: v.string(),
      }),
    ])
  ),
  (arg) => {
    return userQueries.userByUsername(arg)
  }
)

export const userWithProfile = syncedQuery(
  'userWithProfile',
  v.parser(
    v.tuple([
      v.object({
        userId: v.string(),
      }),
    ])
  ),
  (arg) => {
    return userQueries.userWithProfile(arg)
  }
)

export const userWithState = syncedQuery(
  'userWithState',
  v.parser(
    v.tuple([
      v.object({
        userId: v.string(),
      }),
    ])
  ),
  (arg) => {
    return userQueries.userWithState(arg)
  }
)
