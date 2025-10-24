import { randomId } from '@vxrn/helpers'
import type { MutatorContext } from 'over-zero'
import { authServer } from '~/auth/server/authServer'
import { populatePrivateChatStatsForServer } from '~/data/models/helpers/populatePrivateChatStatsForServer'
import { updatePrivateChatStats } from '~/data/models/helpers/updatePrivateChatStats'

async function ensureServerBot(ctx: MutatorContext, serverId: string) {
  const { authData, tx } = ctx
  if (!authData) return
  const userId = authData.id

  const adminRole = await tx.query.role
    .where('serverId', serverId)
    .where('canAdmin', true)
    .one()

  if (!adminRole) {
    console.error(`No admin role, failing mutation`)
    return
  }

  const { user: botUser } = await authServer.api.createUser({
    body: {
      email: `admin${randomId()}@start.chat`,
      name: `Hud`,
      password: `password123`,
      role: 'user',
      data: {
        username: 'hud',
        image: 'https://storage.start.chat/onechatimages/uploads/5dvhtbozp9w-avatar.png',
      },
    },
  })

  await tx.mutate.server.update({
    id: serverId,
    serverBotId: botUser.id,
  })

  await tx.mutate.serverMember.insert({
    joinedAt: Date.now(),
    serverId,
    userId: botUser.id,
    hasClosedWelcome: false,
  })

  await tx.mutate.userRole.insert({
    createdAt: Date.now(),
    granterId: userId,
    roleId: adminRole.id,
    serverId,
    userId: botUser.id,
  })
}

async function ensureAllPrivateChatStats(ctx: MutatorContext, serverId: string) {
  const { authData } = ctx
  if (!authData) {
    throw new Error('must be authenticated')
  }

  console.info(`ensuring all private chat stats for server ${serverId}`)

  // use the existing SQL function to populate stats for this server
  await populatePrivateChatStatsForServer(serverId)

  // also ensure stats exist for any private chats where both users are members of this server
  const count = await updatePrivateChatStats(serverId)

  console.info(`ensured ${count} private chat stats for server ${serverId}`)

  return { count }
}

export const serverActions = {
  ensureServerBot,
  ensureAllPrivateChatStats,
}
