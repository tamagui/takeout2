import { useMemo, useRef } from 'react'
import { useAuth } from '~/auth/client/authClient'
import { useCurrentChannelId } from '~/context/CurrentChannelContext'
import { useCurrentPrivateChatId } from '~/context/CurrentPrivateChatContext'
import { useCurrentServerId } from '~/context/CurrentServerContext'
import type {
  ChannelWithRelations,
  PrivateChatsStats,
  Server,
  ServerWithRelations,
  User,
} from '~/data/types'
import { PRIVATE_CHAT_SEPARATOR } from '~/features/user/getPrivateChatId'
import { time } from '@vxrn/helpers'
import { useQuery, zero } from '~/zero/client'

// important to keep, we want all our types like ServerWithRelations to be accurate as we can reference them easily
type CurrentServer = {
  server?: ServerWithRelations
  initialLoadState: InitialLoadState
  channel?: ChannelWithRelations
  serverId: string
  channelId: string
  members?: readonly User[]
  serverBotId?: string | null
  bot?: User
  isPrivateChat: boolean
  privateChatUser?: User
  topPrivateChats?: readonly (PrivateChatsStats & {
    userServer?: Server
    userA?: User
    userB?: User
  })[]
  isLoading: boolean
}

type InitialLoadState = {
  resolve: () => void
  promise: Promise<void>
}

const initialLoadState: InitialLoadState = (() => {
  let resolve: () => void
  const promise = new Promise<void>((res) => {
    resolve = res
  })
  return {
    promise,
    resolve: resolve!,
  }
})()

// temporary, though it does behave like a global somewhat
let currentServer: CurrentServer['server'] | null = null
export const getCurrentServer = () => currentServer

export const useCurrentServer = (): CurrentServer => {
  const serverId = useCurrentServerId()
  const channelId = useCurrentChannelId()
  const privateChatId = useCurrentPrivateChatId()
  const [userAID, userBID] = channelId.includes(PRIVATE_CHAT_SEPARATOR)
    ? channelId.split(PRIVATE_CHAT_SEPARATOR)
    : privateChatId.split(PRIVATE_CHAT_SEPARATOR)
  const isPrivateChat = Boolean(userAID && userBID)
  const auth = useAuth()
  const userId = auth.user?.id

  /**
   * To prevent infinite re-renders, we want the time to not update on every re-render, since we use this in a query.
   * We can accept a time that is slightly out of date.
   */
  const approximateCurrentTime = useRef(Date.now())
  const topicsGreaterThan = approximateCurrentTime.current - time.ms.days(30)

  const [server, loadState] = useQuery(
    useMemo(() => {
      return zero.query.server
        .where('id', serverId || '')
        .one()
        .related('members')
        .related('member', (q) => q.where('id', userId || '').one())
        .related('roles')
        .related('apps', (q) => q.related('install', (q) => q.one()))
        .related('channel', (q) => {
          return q
            .one()
            .where('id', channelId || '')
            .where('deleted', '!=', true)
            .related('topics', (q) =>
              // TODO once you can order on relations order this and limit
              q.where('createdAt', '>', topicsGreaterThan)
            )
            .related('channelActive', (q) => q.related('user', (q) => q.one()))
            .related('appInstalls', (q) => q.related('app', (q) => q.one()))
            .related('permissions', (q) => q.related('role', (q) => q.one()))
            .related('notifications', (q) => {
              return userId
                ? q.where('userId', userId).where('seenAt', 'IS', null)
                : q.limit(0)
            })
            .related('meeting', (q) =>
              q
                .one()
                .where('active', true)
                .related('meetingUsers', (q) => q.related('user', (q) => q.one()))
            )
        })
        .related('topPrivateChats', (q) => {
          if (!userId) {
            return q.limit(0)
          }

          return q
            .orderBy('score', 'desc')
            .where((eb) => eb.or(eb.cmp('userAId', userId), eb.cmp('userBId', userId)))
            .limit(10)
            .related('userServer', (q) => q.one())
            .related('userA', (q) => q.one())
            .related('userB', (q) => q.one())
        })
    }, [serverId, channelId, userId, topicsGreaterThan]),
    {
      enabled: Boolean(serverId && channelId),
    }
  )

  if (server) {
    initialLoadState.resolve()
  }

  // ik, ik
  currentServer = server || null

  // in profiling this went from 145ms => 130ms when updating lastActive on a user, idk if worth it
  // const server = useDeepMemoizedObject(serverRaw, {
  //   immutableToNestedChanges: {
  //     server: true,
  //     'server.channel': true,
  //   },
  // })

  const [privateChatUsers] = useQuery(
    zero.query.userPublic.where('id', 'IN', [userAID || '', userBID || '']),
    {
      enabled: Boolean(isPrivateChat),
    }
  )
  const privateChatUser = privateChatUsers.find((x) => x.id !== auth.user?.id)

  const channel = server?.channel

  return {
    initialLoadState,
    server,
    channel,
    serverId,
    channelId,
    members: server?.members,
    serverBotId: server?.serverBotId,
    bot: server?.members.find((m) => m.username === 'bot'),
    isPrivateChat,
    privateChatUser,
    topPrivateChats: server?.topPrivateChats,
    isLoading: loadState.type === 'unknown',
  }
}

export const useCurrentServerWithRoles = (enabled = true) => {
  const serverId = useCurrentServerId()
  const channelId = useCurrentChannelId()

  // TODO this is very expensive! getting members for server and role!
  const server = useQuery(
    zero.query.server
      .where('id', serverId || '')
      .one()
      .related('roles', (q) => q.related('members'))
      .related('channels', (q) => q.related('roles', (q) => q.related('members'))),
    {
      enabled: !!serverId && enabled,
    }
  )[0]

  return {
    server,
    roles: server?.roles,
    channel: server?.channels.find((c) => c.id === channelId),
    serverId,
    channelId,
  }
}

// Version that accepts serverId as parameter for sidebar
export const useServer = (serverIdParam?: string) => {
  const contextServerId = useCurrentServerId()
  const serverId = serverIdParam || contextServerId

  const [server, loadState] = useQuery(
    zero.query.server
      .where('id', serverId || '')
      .one()
      .related('members')
      .related('roles'),
    {
      enabled: Boolean(serverId),
    }
  )

  return {
    server,
    serverId,
    isLoading: loadState.type === 'unknown',
  }
}
