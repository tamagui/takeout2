import { boolean, number, string, table } from '@rocicorp/zero'
import { mutations, serverWhere } from 'on-zero'

export const schema = table('notification')
  .columns({
    id: string(),
    userId: string(),
    actorId: string().optional(),
    type: string(), // 'comment' | 'system'
    title: string().optional(),
    body: string().optional(),
    data: string().optional(), // json string for extra data
    read: boolean(),
    createdAt: number(),
  })
  .primaryKey('id')

const permissions = serverWhere('notification', (_, auth) => {
  return _.cmp('userId', auth?.id || '')
})

export const mutate = mutations(schema, permissions)
