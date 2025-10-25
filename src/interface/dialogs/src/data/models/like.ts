import { number, string, table } from '@rocicorp/zero'
import { randomId } from '@vxrn/helpers'
import { mutations, where, type TableInsertRow } from 'over-zero'
import { isUsersOwn } from './queries/isUsersOwn'

export type Like = TableInsertRow<typeof schema>

export const schema = table('like')
  .columns({
    id: string(),
    userId: string(),
    postId: string(),
    createdAt: number(),
  })
  .primaryKey('id')

export const permissions = where('like', (_, auth) => {
  return {
    read: true,
    write: isUsersOwn(_, auth),
  }
})

export const mutate = mutations(schema, permissions, {
  insert: async ({ tx, environment, server, authData }, like: Like) => {
    const existingLike = await tx.query.like
      .where('userId', like.userId)
      .where('postId', like.postId)
      .one()

    if (existingLike) {
      return
    }

    await tx.mutate.like.insert(like)

    if (environment === 'server' && server && authData) {
      const post = await tx.query.post.where('id', like.postId).one()
      server.asyncTasks.push(() =>
        server.actions.analyticsActions().logEvent(authData.id, 'post_liked', {
          postId: like.postId,
          authorId: post?.userId,
        })
      )
    }
  },

  delete: async ({ tx, environment, server, authData }, like: Like) => {
    await tx.mutate.like.delete({ id: like.id })

    if (environment === 'server' && server && authData) {
      server.asyncTasks.push(() =>
        server.actions.analyticsActions().logEvent(authData.id, 'post_unliked', {
          postId: like.postId,
        })
      )
    }
  },

  toggle: async (
    { tx, environment, server, authData },
    data: { userId: string; postId: string }
  ) => {
    const existingLike = await tx.query.like
      .where('userId', data.userId)
      .where('postId', data.postId)
      .one()

    if (existingLike) {
      await tx.mutate.like.delete({ id: existingLike.id })

      if (environment === 'server' && server && authData) {
        server.asyncTasks.push(() =>
          server.actions.analyticsActions().logEvent(authData.id, 'post_unliked', {
            postId: data.postId,
          })
        )
      }
    } else {
      const newLike = {
        id: randomId(),
        userId: data.userId,
        postId: data.postId,
        createdAt: Date.now(),
      }
      await tx.mutate.like.insert(newLike)

      if (environment === 'server' && server && authData) {
        const post = await tx.query.post.where('id', data.postId).one()
        server.asyncTasks.push(() =>
          server.actions.analyticsActions().logEvent(authData.id, 'post_liked', {
            postId: data.postId,
            authorId: post?.userId,
          })
        )
      }
    }
  },
})
