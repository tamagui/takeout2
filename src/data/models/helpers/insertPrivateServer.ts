import { ensureExists } from '@vxrn/helpers'
import { context, type Transaction } from 'over-zero'
import { insertServer } from '~/data/models/helpers/insertServer'
import { FRIENDSHIP_SERVER_NAME } from '~/features/server/constants'
import { getPrivateChatId } from '~/features/user/getPrivateChatId'

export async function insertPrivateServer(
  tx: Transaction,
  requestingId: string,
  acceptingId: string,
  currentUserId: string,
  createdAt: number
) {
  const serverId = getPrivateChatId({ requestingId, acceptingId })
  const existingServer = await tx.query.server.where('id', serverId).one()

  if (existingServer) {
    return { serverId, created: false }
  }

  // create the private chat server
  const { adminRoleId } = await insertServer(
    tx,
    {
      id: serverId,
      channelSort: [],
      createdAt,
      creatorId: currentUserId,
      description: '',
      icon: '',
      isPrivateChat: true,
      userId: requestingId,
      friendId: acceptingId,
      name: FRIENDSHIP_SERVER_NAME,
      state: {},
    },
    {
      avoidAppsDataTasks: true,
    }
  )

  const otherUserId = [acceptingId, requestingId].find((x) => x !== currentUserId)
  ensureExists(otherUserId, 'otherUserId')

  // make other user join
  await tx.mutate.serverMember.insert({
    joinedAt: createdAt,
    serverId,
    userId: otherUserId,
    hasClosedWelcome: false,
  })

  // and other user admin too
  await tx.mutate.userRole.insert({
    createdAt,
    granterId: currentUserId,
    roleId: adminRoleId,
    serverId,
    userId: otherUserId,
  })

  // add friend channel
  await tx.mutate.channel.insert({
    id: serverId,
    createdAt,
    creatorId: currentUserId,
    friendId: acceptingId,
    description: '',
    name: '',
    private: true,
    isPrivateChat: true,
    serverId: serverId,
    deleted: false,
    readonly: false,
  })

  // populate privateChatsStats for all common servers
  const userAServers = await tx.query.serverMember.where('userId', requestingId)
  const userBServers = await tx.query.serverMember.where('userId', acceptingId)

  const userAServerIds = new Set(userAServers.map((m) => m.serverId))
  const commonServerIds = userBServers
    .filter((m) => userAServerIds.has(m.serverId) && m.serverId !== serverId)
    .map((m) => m.serverId)

  // Get context to access server actions
  const { server } = context()

  // insert stats for each common server using SQL
  if (server?.actions.db.sql && commonServerIds.length > 0) {
    for (const commonServerId of commonServerIds) {
      server.asyncTasks.push(async () => {
        try {
          await server.actions.db.sql`
            INSERT INTO "privateChatsStats" (
              "serverId",
              "userServerId",
              "userAId",
              "userBId",
              score,
              "lastMessageAt",
              "messageCountWeek",
              "messageCountMonth",
              "messageCountYear",
              "lastRefreshedAt"
            ) VALUES (
              ${commonServerId},
              ${serverId},
              ${requestingId < acceptingId ? requestingId : acceptingId},
              ${requestingId < acceptingId ? acceptingId : requestingId},
              0,
              ${new Date(createdAt).toISOString()},
              0,
              0,
              0,
              CURRENT_TIMESTAMP
            )
            ON CONFLICT ("serverId", "userServerId") DO NOTHING
          `
        } catch (e) {}
      })
    }
  }

  return { serverId, created: true }
}
