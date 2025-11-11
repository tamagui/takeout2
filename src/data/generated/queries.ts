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

export const postsPaginated = syncedQuery(
  'postsPaginated',
  v.parser(
    v.tuple([
      v.object({
        pageSize: v.number(),
        cursor: v.optional(
          v.union([
            v.object({
              id: v.string(),
            }),
            v.null(),
          ])
        ),
      }),
    ])
  ),
  (arg) => {
    return postQueries.postsPaginated(arg)
  }
)

export const postsWithBlocking = syncedQuery(
  'postsWithBlocking',
  v.parser(
    v.tuple([
      v.object({
        userId: v.optional(v.string()),
        blockedUserIds: v.array(v.string()),
        pageSize: v.number(),
        cursor: v.optional(
          v.union([
            v.object({
              id: v.string(),
            }),
            v.null(),
          ])
        ),
      }),
    ])
  ),
  (arg) => {
    return postQueries.postsWithBlocking(arg)
  }
)

export const searchPosts = syncedQuery(
  'searchPosts',
  v.parser(
    v.tuple([
      v.object({
        searchText: v.string(),
        userId: v.optional(v.string()),
        blockedUserIds: v.array(v.string()),
        pageSize: v.number(),
        cursor: v.optional(
          v.union([
            v.object({
              id: v.string(),
            }),
            v.null(),
          ])
        ),
      }),
    ])
  ),
  (arg) => {
    return postQueries.searchPosts(arg)
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

export const userPostsPaginated = syncedQuery(
  'userPostsPaginated',
  v.parser(
    v.tuple([
      v.object({
        userId: v.string(),
        pageSize: v.number(),
        cursor: v.optional(
          v.union([
            v.object({
              id: v.string(),
            }),
            v.null(),
          ])
        ),
      }),
    ])
  ),
  (arg) => {
    return postQueries.userPostsPaginated(arg)
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
