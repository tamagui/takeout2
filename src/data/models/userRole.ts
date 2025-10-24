import { number, string, table } from '@rocicorp/zero'
import type { TableInsertRow } from 'over-zero'
import { mutations, where } from 'over-zero'

export type UserRole = TableInsertRow<typeof schema>

export const schema = table('userRole')
  .columns({
    serverId: string(),
    userId: string(),
    roleId: string(),
    granterId: string(),
    createdAt: number(),
  })
  .primaryKey('serverId', 'userId', 'roleId')

export const permissions = where('userRole', (_, auth) => {
  const isUserAdmin = _.exists('server', (q) =>
    q.whereExists('role', (q) =>
      q
        .where('canAdmin', true)
        .whereExists('member', (q) => q.where('id', auth?.id || ''))
    )
  )

  return {
    read: true, // TODO
    write: isUserAdmin,
  }
})

export const mutate = mutations(schema, permissions)
