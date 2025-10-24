import { number, string, table } from '@rocicorp/zero'
import { ensure } from '@vxrn/helpers'
import type { TableInsertRow } from 'over-zero'
import { mutations, where } from 'over-zero'

export type Seen = TableInsertRow<typeof schema>

export const schema = table('seen')
  .columns({
    id: string(),
    messageId: string().optional(),
    channelId: string().optional(),
    userId: string(),
    seenAt: number(),
  })
  .primaryKey('id')

export const permissions = where('seen', (_, auth) => {
  ensure(auth)

  const isUsersOwn = _.cmp('userId', auth.id || '')

  return {
    read: isUsersOwn,
    write: isUsersOwn,
  }
})

export const mutate = mutations(schema, permissions)
