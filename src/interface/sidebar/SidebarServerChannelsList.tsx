import { Plus } from '@tamagui/lucide-icons'
import { router } from 'one'
import { memo, useCallback, useLayoutEffect, useState } from 'react'
import type { GestureResponderEvent } from 'react-native'
import { Circle, isWeb, prevent, Text, XStack, YStack } from 'tamagui'
import { useCurrentServerId } from '~/context/CurrentServerContext'
import { useCurrentServerPage } from '~/context/CurrentServerPageContext'
import { useCurrentUserServerIdEmitter } from '~/context/CurrentUserServerContext'
import { usePermission } from '~/zero/client'
import { useCurrentChannelIdEmitter } from '~/features/channel/currentChannelIdEmitter'
import { getChannelLink } from '~/features/channel/getChannelLink'
import { getChannelsSorted } from '~/features/channel/getChannelsSorted'
import { useCurrentServer } from '~/features/server/useCurrentServer'
import {
  useServerChannelsWithStatus,
  type ChannelWithStatus,
} from '~/features/server/useServerChannels'
import { updateUserState, useUserState } from '~/features/user/userState'
import { useEmitterSelector, useEmittersSelector } from '@vxrn/helpers'
import { randomId } from '@vxrn/helpers'
import { BellIcon } from '~/interface/icons/BellIcon'
import { DatabaseIcon } from '~/interface/icons/DatabaseIcon'
import { PeopleIcon } from '~/interface/icons/PeopleIcon'
import { TaskIcon } from '~/interface/icons/TaskIcon'
import { ListItem } from '~/interface/lists/ListItem'
import {
  SortableItem,
  SortableList,
  useSortableDraggingItem,
} from '~/interface/lists/SortableList'
import { closeOpenTooltips } from '~/interface/tooltip/closeOpenTooltips'
import { zero } from '~/zero/client'
import type { Channel } from '~/data/types'
import { notificationsCountEmitter } from '../activity/SidebarActivity'
import { Link } from '../app/Link'
import { Avatar } from '../avatars/Avatar'
import { ButtonSimple } from '../buttons/ButtonSimple'
import { ensureSignedUp } from '../dialogs/isSignedUpEmitter'
import { ChannelListItem } from './ChannelListItem'
import { useChannelsShortcuts } from './useChannelsShortcuts'
import { useAuth } from '~/auth/client/authClient'
import { LineShimmer } from '../shimmer/LineShimmer'
import { AppsIcon } from '../icons/AppsIcon'

const DraggingChannelItem = () => {
  const draggingChannel = useSortableDraggingItem<ChannelWithStatus>()
  const serverId = useCurrentServerId()

  if (!draggingChannel) {
    return null
  }

  return (
    <ChannelListItem variant="sidebar" channel={draggingChannel} serverId={serverId} />
  )
}

export const SidebarServerChannelsList = memo(() => {
  const serverId = useCurrentServerId()

  // for both optimistic updates before re-rendering
  // and for granular isActive re-renders inside each ChannelListItem
  const currentChannelIdEmitter = useCurrentChannelIdEmitter()
  const { server } = useCurrentServer()
  const { user } = useAuth()

  const [channels, loadingState] = useServerChannelsWithStatus()
  const isLoading = loadingState.type === 'unknown' && !channels.length

  const [newSort, setNewSort] = useState<null | string[]>(null)
  const channelsSorted = getChannelsSorted(channels, newSort || server?.channelSort)

  // biome-ignore lint/correctness/useExhaustiveDependencies: ok
  useLayoutEffect(() => {
    setNewSort(null)
    // TODO when [] empty it changes every render
  }, [server?.channelSort.length, server?.channelSort.join('')])

  const activeServer = useUserState('activeServer')
  const lastActiveChannel = useUserState('lastActiveChannel')

  useChannelsShortcuts(channelsSorted)

  // ensure theres always a selected channel
  useLayoutEffect(() => {
    if (!server) return
    if (!activeServer) return
    if (!channels[0]) return
    if (lastActiveChannel[server.id]) return
    updateUserState({
      lastActiveChannel: {
        ...lastActiveChannel,
        [server.id]: channels[0].id,
      },
    })
  }, [channels, server, activeServer, lastActiveChannel])

  const [showTempChannel, setShowTempChannel] = useState('')
  const canEditServer = usePermission('server', 'update', serverId)

  const lastChannel = channels[channels.length - 1]
  const lastId = lastChannel?.id

  useLayoutEffect(() => {
    if (!lastChannel) return
    if (lastId === showTempChannel) {
      setShowTempChannel('')
      router.navigate(getChannelLink(lastChannel))
    }
  }, [lastChannel, lastId, showTempChannel])

  const setActiveOptimistic = useCallback(
    (channelId: string) => {
      currentChannelIdEmitter.emit(channelId)
    },
    [currentChannelIdEmitter]
  )

  const activityListPressOut = useCallback(
    () => setActiveOptimistic('activity'),
    [setActiveOptimistic]
  )

  if (!server) {
    return null
  }

  const handleInsertChannelPress = (e: GestureResponderEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowTempChannel(randomId())
  }

  return (
    <>
      {!!serverId && (
        <ServerChannelItem
          serverId={serverId}
          serverIcon={server.icon}
          serverName={server.name}
          canEditServer={canEditServer}
          onInsertChannelPress={handleInsertChannelPress}
          onPressOut={() => setActiveOptimistic(server.id)}
        />
      )}

      {isLoading && (
        <>
          <XStack mt={4} mb={2} justify="space-between">
            <HorizontalItem>
              <LineShimmer width={60} height={50} />
            </HorizontalItem>
            <HorizontalItem>
              <LineShimmer width={60} height={50} />
            </HorizontalItem>
            <HorizontalItem>
              <LineShimmer width={60} height={50} />
            </HorizontalItem>
            <HorizontalItem>
              <LineShimmer width={60} height={50} />
            </HorizontalItem>
          </XStack>

          <YStack gap="$1.5">
            <ListItem.Loading />
            <ListItem.Loading />
            <ListItem.Loading />
          </YStack>
        </>
      )}

      {!isLoading && (
        <>
          {!!user && (
            <XStack mt={4} mb={2} justify="space-between">
              <ActivityButton serverId={serverId} onPressOut={activityListPressOut} />

              <DataButton
                serverId={serverId}
                onPressOut={() => setActiveOptimistic('data')}
              />

              <TasksButton
                serverId={serverId}
                onPressOut={() => setActiveOptimistic('tasks')}
              />

              <AppsButton
                serverId={serverId}
                onPressOut={() => setActiveOptimistic('members')}
              />
            </XStack>
          )}

          <YStack position="relative">
            <SortableList
              disable={!canEditServer}
              items={channelsSorted}
              dragOverlay={<DraggingChannelItem />}
              onSort={async (sorted) => {
                if (!server) return
                const channelSort = sorted.map((i) => i.id)
                setNewSort(channelSort)
                zero.mutate.server.update({
                  id: server.id,
                  channelSort: channelSort,
                })
              }}
            >
              {channelsSorted.map((channel) => {
                // this shouldn't be in channelSort, but just to be safe (and its in our seed data)
                if (serverId === channel.id) {
                  return null
                }

                return (
                  <SortableItem key={channel.id} id={channel.id}>
                    <ChannelListItem
                      variant="sidebar"
                      channel={channel}
                      serverId={serverId}
                      showContextMenu
                      onPressOut={() => setActiveOptimistic(channel.id)}
                    >
                      {channel.name}
                    </ChannelListItem>
                  </SortableItem>
                )
              })}
            </SortableList>

            {!!showTempChannel && (
              <ChannelListItem
                editing
                variant="sidebar"
                serverId={serverId}
                onEditComplete={async (name) => {
                  const user = await ensureSignedUp()

                  if (!server) {
                    alert('no server')
                    return
                  }

                  const id = showTempChannel

                  const next: Channel = {
                    id,
                    description: '',
                    name,
                    private: false,
                    serverId: server.id,
                    creatorId: user.id,
                    createdAt: Date.now(),
                    deleted: false,
                    isPrivateChat: false,
                    readonly: false,
                  }

                  zero.mutate.channel.insert(next)

                  const channelSort = [
                    ...(server?.channelSort || [])
                      // cleans up deleted channels
                      .filter((x) => channels.some((c) => c.id === x)),
                    id,
                  ]

                  zero.mutate.server.update({
                    id: server.id,
                    channelSort,
                  })
                }}
                onEditCancel={() => {
                  setShowTempChannel('')
                }}
              />
            )}
          </YStack>
        </>
      )}
    </>
  )
})

type HorizontalButtonProps = {
  serverId: string
  onPressOut: (e: GestureResponderEvent) => void
}

const iconSize = 22

const DataButton = memo(({ serverId, onPressOut }: HorizontalButtonProps) => {
  const isActive = useCurrentServerPage() === 'data'

  return (
    <Link
      delayNavigation
      display="flex"
      flex={1}
      href={`/${serverId}/${serverId}-data`}
      onPressOut={onPressOut}
      tooltip="Data"
    >
      <HorizontalItem active={isActive}>
        <DatabaseIcon size={iconSize} />
      </HorizontalItem>
    </Link>
  )
})

const TasksButton = memo(({ serverId, onPressOut }: HorizontalButtonProps) => {
  const isActive = useCurrentServerPage() === 'tasks'

  return (
    <Link
      delayNavigation
      display="flex"
      flex={1}
      href={`/${serverId}/${serverId}-tasks`}
      onPressOut={onPressOut}
      tooltip="Tasks"
    >
      <HorizontalItem active={isActive}>
        <TaskIcon size={iconSize} />
      </HorizontalItem>
    </Link>
  )
})

const AppsButton = memo(({ serverId, onPressOut }: HorizontalButtonProps) => {
  const isActive = useCurrentServerPage() === 'apps'

  return (
    <Link
      delayNavigation
      display="flex"
      flex={1}
      href={`/${serverId}/${serverId}-apps`}
      onPressOut={onPressOut}
      tooltip="Apps"
    >
      <HorizontalItem active={isActive}>
        <AppsIcon size={iconSize} />
      </HorizontalItem>
    </Link>
  )
})

const HorizontalItem = ({ children, active }: { children: any; active?: boolean }) => {
  return (
    <XStack flex={1} mx={2}>
      <ListItem
        variant="sidebar"
        active={active}
        size="small"
        height={52}
        width="auto"
        pl={3}
        pr={4}
        flex={1}
        items="center"
        justify="center"
      >
        {children}
      </ListItem>
    </XStack>
  )
}

const ActivityButton = memo(({ serverId, onPressOut }: HorizontalButtonProps) => {
  const isActive = useCurrentServerPage() === 'activity'
  const countString = useEmitterSelector(notificationsCountEmitter, (val) => {
    if (val === null) {
      return ''
    }
    if (val > 9) {
      return '9+'
    }
    return `${val}`
  })

  return (
    <Link
      delayNavigation
      display="flex"
      flex={1}
      href={`/${serverId}/activity`}
      onPressOut={onPressOut}
      {...(isActive &&
        isWeb &&
        router.canGoBack() && {
          onPress(e) {
            e.preventDefault()
            e.stopPropagation()
            router.back()
          },
          onPressOut() {
            // nothing
          },
        })}
    >
      <HorizontalItem active={isActive}>
        <BellIcon size={iconSize} />
        <Circle size={14} position="absolute" t={8} r={11}>
          <Text opacity={0.35} fontFamily="$mono" fontSize="$3">
            {countString}
          </Text>
        </Circle>
      </HorizontalItem>
    </Link>
  )
})

// <!-- Icon from Solar by 480 Design - https://creativecommons.org/licenses/by/4.0/ -->

const ServerChannelItem = memo(
  ({
    serverId,
    serverIcon,
    serverName,
    canEditServer,
    onInsertChannelPress,
    onPressOut,
  }: {
    serverId: string
    serverIcon: string
    serverName: string
    canEditServer: boolean | null
    onInsertChannelPress: (e: GestureResponderEvent) => void
    onPressOut: (e: GestureResponderEvent) => void
  }) => {
    const currentChannelIdEmitter = useCurrentChannelIdEmitter()
    const currentUserServerIdEmitter = useCurrentUserServerIdEmitter()
    const isActive = useEmittersSelector(
      [currentChannelIdEmitter, currentUserServerIdEmitter],
      ([channelId, userServerId]) => (userServerId ? false : channelId === serverId)
    )
    return (
      <Link delayNavigation display="flex" href={`/${serverId}`} onPressOut={onPressOut}>
        <ListItem active={isActive} variant="sidebar" height="auto" py={14} mb={-6}>
          <Avatar pointerEvents="none" size={20} image={serverIcon} />
          {/* <XStack flex={1} overflow="hidden"> */}
          <ListItem.Text
            fontFamily="$mono"
            size="medium"
            letterSpacing={0}
            opacity={isActive ? 1 : 0.8}
            select="none"
            flex={10}
            ellipse
            textWrap="nowrap"
          >
            {serverName}
          </ListItem.Text>
          {/* </XStack> */}
          {Boolean(canEditServer) && (
            <XStack x={4} my={-8}>
              {canEditServer ? (
                <ButtonSimple
                  variant="transparent"
                  onPressIn={prevent}
                  onPressOut={prevent}
                  opacity={0.6}
                  tooltip="Create channel"
                  tooltipDelayed
                  $group-item-hover={{
                    opacity: 0.8,
                  }}
                  hoverStyle={{
                    opacity: 1,
                  }}
                  onPress={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    closeOpenTooltips()
                    onInsertChannelPress?.(e)
                  }}
                >
                  <Plus size={12} opacity={0.5} />
                </ButtonSimple>
              ) : null}
            </XStack>
          )}
        </ListItem>
      </Link>
    )
  }
)
