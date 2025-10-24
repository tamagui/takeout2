import { ensure } from '@vxrn/helpers'
import { mutations, type MutatorContext } from 'over-zero'
import type { ServerActions } from '../server/createServerActions'
import type { PrivateBetaInvite } from './privateBetaInvite'

export const mutate = mutations({
  sendEmail: async function email<
    Name extends keyof ServerActions['email'],
    Options extends Parameters<ServerActions['email'][Name]>[1],
  >(
    // TODO not needing type here
    { server, authData }: MutatorContext,
    {
      name,
      options,
    }: {
      name: Name
      options: Options
    }
  ) {
    if (server) {
      ensure(authData)
      ensure(authData?.role === 'admin')
      const user = await server.actions.user.getUserPrivate(authData.id)
      ensure(user)
      // @ts-expect-error
      await server.actions.email[name](user.email, options)
    }
  },

  inviteToPrivateBeta: async (
    { server, authData, tx }: MutatorContext,
    invite: PrivateBetaInvite
  ) => {
    ensure(authData)
    ensure(authData?.role === 'admin')

    await tx.mutate.privateBetaInvite.insert(invite)

    if (server) {
      await server.actions.email.sendPrivateBetaInvite({ email: invite.email })
    }
  },
})
