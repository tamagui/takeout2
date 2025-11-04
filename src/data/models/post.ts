import { boolean, number, string, table } from '@rocicorp/zero'
import { mutations, where } from 'over-zero'
import type { Post } from '../types'

export const schema = table('post')
  .columns({
    id: string(),
    userId: string(),
    image: string(),
    caption: string().optional(),
    hiddenByAdmin: boolean(),
    createdAt: number(),
    updatedAt: number().optional(),
  })
  .primaryKey('id')

const permissions = where('post', (_, auth) => {
  return _.cmp('userId', auth?.id || '')
})

export const mutate = mutations(schema, permissions, {
  insert: async ({ tx, environment, server, authData }, post: Post) => {
    await tx.mutate.post.insert(post)

    if (environment === 'server' && server && authData) {
      server.asyncTasks.push(() =>
        server.actions.analyticsActions().logEvent(authData.id, 'post_created', {
          postId: post.id,
          hasImage: Boolean(post.image),
        })
      )
    }
  },

  delete: async ({ tx, environment, server, authData }, obj: { id: string }) => {
    await tx.mutate.post.delete({ id: obj.id })

    if (environment === 'server' && server && authData) {
      const post = await tx.query.post.where('id', obj.id).one().run()

      if (post) {
        server.asyncTasks.push(() =>
          server.actions.analyticsActions().logEvent(authData.id, 'post_deleted', {
            postId: obj.id,
            postAge: post?.createdAt ? Date.now() - post.createdAt : undefined,
            hasImage: Boolean(post?.image),
          })
        )
      }
    }
  },
})
