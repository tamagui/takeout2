import { boolean, number, string, table } from '@rocicorp/zero'
import type { TableInsertRow } from 'over-zero'
import { ensureLoggedIn, mutations, where } from 'over-zero'

export type Invite = TableInsertRow<typeof schema>

export const schema = table('invite')
  .columns({
    id: string(),
    email: string(),
    serverId: string(),
    roleId: string().optional(),
    inviterId: string(),
    accepted: boolean(),
    acceptedAt: number().optional(),
    acceptedById: string().optional(),
    expiresAt: number(),
    createdAt: number(),
    updatedAt: number().optional(),
  })
  .primaryKey('id')

export const permissions = where('invite', (_, auth) => {
  const isUserAdmin = _.exists('server', (q) =>
    q.whereExists('role', (q) =>
      q
        .where('canAdmin', true)
        .whereExists('member', (q) => q.where('id', auth?.id || ''))
    )
  )

  return {
    read: _.or(
      isUserAdmin,
      _.cmp('inviterId', auth?.id || ''),
      _.cmp('email', auth?.email || '')
    ),
    write: _.or(isUserAdmin, _.cmp('inviterId', auth?.id || '')),
  }
})

export const mutate = mutations(schema, permissions, {
  insert: async ({ tx, server }, invite: Invite) => {
    ensureLoggedIn()
    await tx.mutate.invite.insert(invite)

    if (server) {
      server.asyncTasks.push(async () => {
        await server.actions.email.sendInviteEmail({
          inviteId: invite.id,
          email: invite.email,
          serverId: invite.serverId,
          roleId: invite.roleId || undefined,
          inviterId: invite.inviterId,
        })
      })
    }
  },
})
