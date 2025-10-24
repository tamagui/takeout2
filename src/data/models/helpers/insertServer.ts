import type { Transaction } from 'over-zero'
import type { Server } from '~/data/types'

export async function insertServer(
  tx: Transaction,
  server: Server,
  options?: {
    withMainChannel?: boolean
    avoidAppsDataTasks?: boolean
  }
) {
  // first insert it, because of relations in db:
  await tx.mutate.server.insert(server)

  const serverId = server.id
  const adminRoleId = `${server.id}-role-admin`
  const teamRoleId = `${server.id}-role-team`

  // admin role - using blue color from predefined colors
  await tx.mutate.role.insert({
    id: adminRoleId,
    color: 'hsl(210, 80%, 55%)',
    creatorId: server.creatorId,
    name: 'Admin',
    canAdmin: true,
    canEditChannel: true,
    canEditServer: true,
    canEditApp: true,
    createdAt: server.createdAt,
    serverId,
  })

  // team role - using red color from predefined colors
  await tx.mutate.role.insert({
    id: teamRoleId,
    color: 'hsl(0, 75%, 55%)',
    creatorId: server.creatorId,
    name: 'Team',
    canAdmin: false,
    canEditChannel: false,
    canEditServer: false,
    canEditApp: false,
    createdAt: server.createdAt,
    serverId,
  })

  await tx.mutate.userRole.insert({
    createdAt: server.createdAt,
    granterId: server.creatorId,
    roleId: adminRoleId,
    serverId,
    userId: server.creatorId,
  })

  await tx.mutate.serverMember.insert({
    joinedAt: server.createdAt,
    serverId,
    userId: server.creatorId,
    hasClosedWelcome: false,
  })

  // note: no longer inserting "data" app - it was a good test of apps themselves
  // but in practice its much easier for us to just render internally the data channel
  // see DataIndexPage for where it moved
  // if (!options?.avoidApps) {
  //   const dataApp = await tx.query.app.where('id', 'data').one()

  //   if (!dataApp) {
  //     console.warn(`No data app????`)
  //   } else {
  //     await tx.mutate.appInstall.insert({
  //       id: serverId,
  //       appId: dataApp.id,
  //       createdAt: server.createdAt,
  //       creatorId: server.creatorId,
  //       serverId: server.id,
  //     })
  //   }
  // }

  if (options?.withMainChannel) {
    // insert the main server channel
    await tx.mutate.channel.insert({
      createdAt: server.createdAt,
      id: serverId, // for now just use this to indicate its the main server channel
      description: '',
      creatorId: server.creatorId,
      name: server.name,
      private: false,
      readonly: true,
      serverId,
      deleted: false,
      isPrivateChat: false,
    })
  }

  if (!options?.avoidAppsDataTasks) {
    await insertServerTaskChannel(tx, server)
    await insertServerDataChannel(tx, server)
    await insertServerAppsChannel(tx, server)
  }

  return {
    adminRoleId,
    teamRoleId,
  }
}

export async function insertServerTaskChannel(tx: Transaction, server: Server) {
  await tx.mutate.channel.insert({
    createdAt: server.createdAt,
    id: `${server.id}-tasks`,
    description: '',
    creatorId: server.creatorId,
    name: server.name,
    private: true,
    readonly: true,
    serverId: server.id,
    deleted: false,
    isPrivateChat: false,
    type: 'bot',
  })
}

export async function insertServerDataChannel(tx: Transaction, server: Server) {
  await tx.mutate.channel.insert({
    createdAt: server.createdAt,
    id: `${server.id}-data`,
    description: '',
    creatorId: server.creatorId,
    name: server.name,
    private: true,
    readonly: true,
    serverId: server.id,
    deleted: false,
    isPrivateChat: false,
    type: 'bot',
  })
}

export async function insertServerAppsChannel(tx: Transaction, server: Server) {
  await tx.mutate.channel.insert({
    createdAt: server.createdAt,
    id: `${server.id}-apps`,
    description: '',
    creatorId: server.creatorId,
    name: server.name,
    private: true,
    readonly: true,
    serverId: server.id,
    deleted: false,
    isPrivateChat: false,
    type: 'bot',
  })
}
