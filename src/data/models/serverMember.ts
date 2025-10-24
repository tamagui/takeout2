import { boolean, number, string, table } from '@rocicorp/zero'
import type { TableInsertRow } from 'over-zero'
import { mutations, where } from 'over-zero'

export type ServerMember = TableInsertRow<typeof schema>

export const schema = table('serverMember')
  .columns({
    serverId: string(),
    userId: string(),
    hasClosedWelcome: boolean(),
    joinedAt: number(),
  })
  .primaryKey('serverId', 'userId')

export const permissions = where('serverMember', (_, auth) => {
  const isUserAdmin = _.exists('server', (q) =>
    q.whereExists('role', (q) =>
      q
        .where('canAdmin', true)
        .whereExists('member', (q) => q.where('id', auth?.id || ''))
    )
  )

  const isOwnOrAdmin = _.or(
    // user can manage their own membership
    _.cmp('userId', auth?.id || ''),
    isUserAdmin
  )

  return {
    read: isOwnOrAdmin,
    write: isOwnOrAdmin,
  }
})

export const mutate = mutations(schema, permissions, {
  insert: async ({ tx, server }, row: ServerMember) => {
    // first insert the server member
    await tx.mutate.serverMember.insert(row)

    if (server) {
      // check if this is a private chat server
      const serverRecord = await tx.query.server.where('id', row.serverId).one()
      if (serverRecord?.isPrivateChat) {
        return // don't create private chats for private chat servers
      }

      // get recently active members from this server
      const serverMembers = await tx.query.serverMember
        .where('serverId', row.serverId)
        .where('userId', '!=', row.userId)
        .limit(100) // get more initially

      // get user details for these members
      const userIds = serverMembers.map((m) => m.userId)
      if (userIds.length === 0) return

      const users = await tx.query.userPublic.where('id', 'IN', userIds)

      // sort by lastActive and take top 10
      const recentUsers = users
        .sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0))
        .slice(0, 10)

      // create private servers for each recent user
      const { insertPrivateServer: createPrivateServer } = await import(
        '~/data/models/helpers/insertPrivateServer'
      )
      for (const recentUser of recentUsers) {
        await createPrivateServer(tx, row.userId, recentUser.id, row.userId, Date.now())
      }

      // populate stats for this server if we have sql available
      if (server.actions.db.sql) {
        server.asyncTasks.push(async () => {
          await server.actions.db.sql`
            SELECT populate_private_chats_stats_for_server(${row.serverId})
          `
        })
      }
    }
  },
})
