import type { QueryResultDetails } from '@rocicorp/zero/react'
import { useMemo } from 'react'
import { EMPTY_ARRAY } from '@vxrn/helpers'
import { useCurrentServerId } from '~/context/CurrentServerContext'
import { useUser } from '~/features/user/useUser'
import { useQuery, zero } from '~/zero/client'
import type { Channel, Message, Notification } from '~/data/types'

export type ChannelWithStatus = Channel & {
  seen: boolean
  notifications?: readonly Notification[]
  latestMessage?: Message
}

export const useServerChannels = (): [readonly Channel[], QueryResultDetails] => {
  const serverId = useCurrentServerId()
  const [serverWithChannels, state] = useQuery(
    zero.query.server
      .one()
      .where('id', serverId)
      .orderBy('createdAt', 'desc')
      .related('channels', (q) => q.orderBy('createdAt', 'asc')),
    {
      enabled: Boolean(serverId),
    }
  )

  return useMemo(
    () => [serverWithChannels?.channels || [], state],
    [serverWithChannels, state]
  )
}

type ChannelsWithStatus = [ChannelWithStatus[], QueryResultDetails]

export const useServerChannelsWithStatus = (
  serverIdParam?: string
): ChannelsWithStatus => {
  const contextServerId = useCurrentServerId()
  const serverId = serverIdParam || contextServerId
  const { user } = useUser()
  const userId = user?.id || ''

  const [channels, channelsState] = useServerChannelsParam(serverId)

  const [data, state] = useQuery(
    zero.query.server
      .where('id', serverId)
      .one()
      .orderBy('createdAt', 'desc')
      // get server channels
      .related('channels', (q) =>
        q
          // where user has seen them
          .whereExists('seen', (q) => q.where('userId', userId))
          .orderBy('createdAt', 'asc')
          .related('notifications', (q) =>
            q.where('seenAt', 'IS', null).where('userId', userId)
          )
          // get most recent channel message
          .related('messages', (q) => {
            return (
              q
                // add seen to check if seen latest message
                .related('seen', (q) => q.where('userId', userId))
                .where('type', '!=', 'draft')
                .where('threadId', 'IS', null)
                .where('creatorId', '!=', userId)
                .orderBy('order', 'desc')
                .one()
            )
          })
      ),
    {
      enabled: !!serverId,
    }
  )

  const channelsWithStatus = data?.channels

  return useMemo(() => {
    if (
      (!channels.length && channelsState.type === 'unknown') ||
      (!data && state.type === 'unknown')
    ) {
      return [EMPTY_ARRAY, { type: 'unknown' }] satisfies ChannelsWithStatus
    }

    const channelsWithStatuses = channels.flatMap((channel) => {
      const channelWithMessages = (channelsWithStatus || []).find(
        (x) => x.id === channel.id
      )
      const latestMessage = channelWithMessages?.messages

      const seen = !latestMessage || !!latestMessage.seen

      return [
        {
          ...channel,
          seen: !!seen,
          latestMessage: latestMessage,
        } satisfies ChannelWithStatus,
      ]
    })

    return [channelsWithStatuses, { type: 'complete' }] satisfies ChannelsWithStatus
  }, [channelsState.type, state.type, channels, channelsWithStatus, data])
}

// Version that accepts serverId as parameter
export const useServerChannelsParam = (
  serverId: string
): [readonly Channel[], QueryResultDetails] => {
  const [serverWithChannels, state] = useQuery(
    zero.query.server
      .one()
      .where('id', serverId)
      .orderBy('createdAt', 'desc')
      .related('channels', (q) => q.orderBy('createdAt', 'asc')),
    {
      enabled: Boolean(serverId),
    }
  )

  return useMemo(
    () => [serverWithChannels?.channels || [], state],
    [serverWithChannels, state]
  )
}
