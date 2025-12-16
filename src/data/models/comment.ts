import { number, string, table } from '@rocicorp/zero'
import { mutations, serverWhere } from 'over-zero'

export const schema = table('comment')
  .columns({
    id: string(),
    postId: string(),
    userId: string(),
    content: string(),
    createdAt: number(),
  })
  .primaryKey('id')

const permissions = serverWhere('comment', (_, auth) => {
  return _.cmp('userId', auth?.id || '')
})

export const mutate = mutations(schema, permissions)
