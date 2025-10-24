import { Bot, Lock } from '@tamagui/lucide-icons'
import { randomId, useAsyncEffect, useEmitterSelector } from '@vxrn/helpers'
import { useMemoStable } from '@vxrn/hooks'
import { router } from 'one'
import { memo } from 'react'
import { AnimatePresence, Circle, isWeb, SizableText, XStack } from 'tamagui'
import { useCurrentChannelIdEmitter } from '~/features/channel/currentChannelIdEmitter'
import { getChannelLink } from '~/features/channel/getChannelLink'
import type { ChannelWithStatus } from '~/features/server/useServerChannels'
import { topBarSlidingPopoverController } from '~/features/topbar/TopBarSlidingPopover'
import { getUser } from '~/features/user/getUser'
import { zero } from '~/zero/client'
import { usePermission } from '~/zero/client'
import { dialogConfirm } from '../dialogs/actions'
import { ListItem, type ListItemProps } from '../lists/ListItem'
import { cancelSort } from '../lists/SortableList'
import type { ContextMenuItem } from '../menu/types'

export type ChannelListItemProps = ListItemProps & {
  showContextMenu?: boolean
  channel?: ChannelWithStatus
  serverId: string
  onEditComplete?: (value: string) => void | Promise<void>
  editing?: boolean
  onEditCancel?: () => void
  ref?: any
}

export const ChannelListItem = memo(
  ({
    channel,
    serverId,
    onEditComplete,
    showContextMenu,
    editing,
    onEditCancel,
    ref,
    ...rest
  }: ChannelListItemProps) => {
    const channelId = channel?.id
    const canUpdate = usePermission('channel', 'update', channelId, !!channelId)
    const channelIdEmitter = useCurrentChannelIdEmitter()
    const isActive = useEmitterSelector(channelIdEmitter, (val) => val === channelId)
    const hasUnseenMessages = channel?.latestMessage && !channel?.seen
    const hasNotifications = Boolean(
      !isActive && (channel?.notifications || hasUnseenMessages)
    )

    const contextMenuItems = useMemoStable(
      (): ContextMenuItem[] | undefined => {
        if (!showContextMenu) return
        if (!canUpdate) return
        return [
          {
            text: 'Settings',
            action() {
              topBarSlidingPopoverController.emit({ type: 'open', id: 'channel' })
            },
          },

          {
            text: 'Delete',
            async action() {
              if (!channel?.id) return
              if (await dialogConfirm({ title: `Delete this channel?` })) {
                await zero.mutate.channel.update({
                  deleted: true,
                  id: channel?.id,
                })

                // navigate to server channel
                router.navigate(`/${serverId}`)
              }
            },
          },
        ]
      },
      [showContextMenu, canUpdate, channelId],
      {
        name: 'contextMenu',
      }
    )

    // mark notifications as cleared and mark latest message as seen
    useAsyncEffect(
      async (signal) => {
        const user = getUser()
        if (!user || !channel) return

        // Only mark as seen when actively viewing the channel
        if (isActive) {
          // Clear notifications if any
          const notifications = channel.notifications
          if (notifications) {
            await zero.mutateBatch(async (tx) => {
              for (const notification of notifications) {
                if (!notification.seenAt) {
                  await tx.notification.update({
                    id: notification.id,
                    seenAt: Date.now(),
                  })
                }
              }
            })
          }

          // Mark latest message as seen to clear hasUnseenMessages
          if (hasUnseenMessages) {
            // Use the latest message that's already fetched from useServerChannelsWithStatus
            const latestMessage = channel.latestMessage

            if (latestMessage && !signal.aborted) {
              // Check if this message is already seen
              const existingSeen = await zero.query.seen
                .where('userId', user.id)
                .where('messageId', latestMessage.id)
                .run({ type: 'complete' })

              if (existingSeen.length === 0) {
                // Mark as seen
                await zero.mutate.seen.insert({
                  id: randomId(),
                  userId: user.id,
                  messageId: latestMessage.id,
                  channelId: channel.id,
                  seenAt: Date.now(),
                })
              } else {
                console.info('Message already seen:', latestMessage.id)
              }
            }
          }
        }
      },
      [isActive, hasUnseenMessages]
    )

    return (
      <ListItem
        variant="sidebar"
        size="small"
        ref={ref}
        active={isActive}
        contextMenu={contextMenuItems}
        aboveMenuIcon={
          channel?.private ? (
            <Lock color="$color11" opacity={hasNotifications ? 1 : 0.3} size={10} />
          ) : null
        }
        onContextMenu={cancelSort}
        editable
        editing={editing}
        editingValue={channel?.name ?? ''}
        onEditCancel={onEditCancel}
        onEditComplete={async (next) => {
          if (!channel || onEditComplete) {
            onEditComplete?.(next)
          } else {
            zero.mutate.channel.update({
              id: channel.id,
              name: next,
            })
          }
        }}
        onPress={() => {
          // let it set active
          setTimeout(() => {
            if (channel) {
              router.navigate(getChannelLink(channel))
            }
          }, 60)
        }}
        {...rest}
      >
        <XStack width={9} items="center" justify="flex-end" contain="layout paint">
          <SizableText
            fontFamily="$mono"
            size="$3"
            color="$color11"
            opacity={hasNotifications ? 1 : 0.3}
            fontWeight={hasNotifications ? '600' : '400'}
          >
            #
          </SizableText>
        </XStack>

        <XStack items="center" gap="$2" flex={1}>
          <ListItem.Text ellipse bold={hasNotifications}>
            {`${channel?.name || ''}`}
          </ListItem.Text>

          {channel?.type === 'bot' && (
            <ListItem.Pad>
              <Bot size={12} opacity={0.2} />
            </ListItem.Pad>
          )}
        </XStack>

        <AnimatePresence>
          {hasNotifications ? (
            <Circle
              position="absolute"
              t="50%"
              r={12}
              y={-2}
              key="unseen-indicator"
              display={isWeb ? 'inline-flex' : 'flex'}
              size={4}
              bg="$red10"
              animation="bouncy"
              enterStyle={{
                opacity: 0,
                scale: 0.5,
              }}
              exitStyle={{
                opacity: 0,
                scale: 0.5,
              }}
            />
          ) : null}
        </AnimatePresence>
      </ListItem>
    )
  }
)
