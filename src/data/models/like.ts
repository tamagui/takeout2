import { number, string, table } from '@rocicorp/zero'
import { mutations, where, type TableInsertRow } from 'over-zero'

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
    write: _.cmp('userId', auth?.id || ''),
  }
})

export const mutate = mutations(schema, permissions, {
  toggle: async ({ tx, authData }, params: { postId: string }) => {
    if (!authData) throw new Error('Not authenticated')

    const existing = await tx.query.like
      .where('userId', authData.id)
      .where('postId', params.postId)
      .one()

    if (existing) {
      // Unlike
      await tx.mutate.like.delete({ id: existing.id })
    } else {
      // Like
      await tx.mutate.like.insert({
        id: `like_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        userId: authData.id,
        postId: params.postId,
        createdAt: Date.now(),
      })
    }
  },
})
