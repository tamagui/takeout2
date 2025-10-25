import { boolean, number, string, table } from '@rocicorp/zero'
import { mutations, where, type TableInsertRow } from 'over-zero'
import { isUsersOwn } from './queries/isUsersOwn'

export type Post = TableInsertRow<typeof schema>

export const schema = table('post')
  .columns({
    id: string(),
    userId: string(),
    image: string(),
    likesCount: number(),
    caption: string().optional(),
    draft: boolean(),
    hiddenByAdmin: boolean(),
    createdAt: number(),
    updatedAt: number().optional(),
  })
  .primaryKey('id')

export const permissions = where('post', (_, auth) => {
  return {
    read: true,
    write: isUsersOwn(_, auth),
  }
})

export const mutate = mutations(schema, permissions, {
  insert: async ({ tx, environment, server, authData }, post: Post) => {
    await tx.mutate.post.insert(post)

    if (environment === 'server' && server && authData) {
      server.asyncTasks.push(() =>
        server.actions.analyticsActions().logEvent(authData.id, 'post_created', {
          postId: post.id,
          hasImage: Boolean(post.image),
          isDraft: post.draft,
        })
      )
    }
  },

  delete: async ({ tx, environment, server, authData }, obj: { id: string }) => {
    const post = await tx.query.post.where('id', obj.id).one()

    await tx.mutate.post.delete({ id: obj.id })

    if (environment === 'server' && server && authData && post) {
      server.asyncTasks.push(() =>
        server.actions.analyticsActions().logEvent(authData.id, 'post_deleted', {
          postId: obj.id,
          postAge: post.createdAt ? Date.now() - post.createdAt : undefined,
          hasImage: Boolean(post.image),
          isDraft: post.draft,
        })
      )
    }
  },
})
