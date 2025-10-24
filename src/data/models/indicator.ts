import { number, string, table } from '@rocicorp/zero'
import type { TableInsertRow } from 'over-zero'
import { mutations, where } from 'over-zero'

export type Indicator = TableInsertRow<typeof schema>

export const schema = table('indicator')
  .columns({
    id: string(),
    type: string(),
    serverId: string().optional(),
    channelId: string().optional(),
    threadId: string().optional(),
    userId: string(),
    lastActiveAt: number(),
  })
  .primaryKey('id')

export const permissions = where('indicator', (_, auth) => {
  return {
    read: true,
    write: _.cmp('userId', auth?.id || ''), // only user can update their own indicators
  }
})

export const mutate = mutations(schema, permissions, {})
