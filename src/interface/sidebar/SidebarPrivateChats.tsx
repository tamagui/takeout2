import { useEmitterSelector } from '@vxrn/helpers'
import { useMemo } from 'react'
import { EnsureFlexed, Spacer, View, XStack, YStack } from 'tamagui'
import { useAuth } from '~/auth/client/authClient'
import { useCurrentUserServerIdEmitter } from '~/context/CurrentUserServerContext'
import { useCurrentServer } from '~/features/server/useCurrentServer'
import { UserBubble, type UserBubbleProps } from '~/features/user/ui/UserBubble'
import { useFriends } from '~/features/user/useFriends'
import { useLatestNotifications } from '../activity/useLatestNotifications'

export const SidebarPrivateChats = () => {
  const { notifications } = useLatestNotifications()
  const { topPrivateChats } = useCurrentServer()
  const { user: currentUser } = useAuth()
  const friends = useFriends()

  const allChats = useMemo(() => {
    const recentChats =
      topPrivateChats?.map((stat) => {
        const otherUser = stat.userAId === currentUser?.id ? stat.userB : stat.userA
        return {
          user: otherUser,
          notification: notifications.find((n) => n.fromUserId === otherUser?.id),
          userServerId: stat.userServerId,
          userServer: stat.userServer,
          score: stat.score,
          lastMessageAt: stat.lastMessageAt,
        }
      }) || []

    const recentChatUserIds = new Set(
      recentChats.map((chat) => chat.user?.id).filter(Boolean)
    )

    const remainingFriends =
      friends?.filter((friend) => !recentChatUserIds.has(friend.id)) || []

    return [
      ...recentChats,
      ...remainingFriends
        .slice(0, Math.max(0, 10 - recentChats.length))
        .map((friend) => ({
          user: friend,
          userServerId: null,
          score: 0,
          lastMessageAt: null,
          notification: notifications.find((n) => n.fromUserId === friend.id),
        })),
    ]
  }, [topPrivateChats, currentUser, notifications, friends])

  if (!currentUser) {
    return null
  }

  return (
    <YStack pointerEvents="none" minH="max-content" gap="$3">
      {/* <ListTitle>
        <ListTitle.Text>People</ListTitle.Text>

        <ListItem.After>
          <ButtonSimple
            mr={-8}
            variant="transparent"
            tooltip="Add friend"
            onPress={() => {
              if (!ensureSignedUp()) return
              dialogAddFriend()
            }}
          >
            <Plus size={12} opacity={0.3} />
          </ButtonSimple>
        </ListItem.After>
      </ListTitle> */}

      <YStack maxW="calc(100% - 18px)" self="center">
        <EnsureFlexed />
        <XStack
          mx={-6}
          l="6.2%"
          x={4}
          flexWrap="wrap"
          columnGap="calc(29.5% - 52px)"
          rowGap={4}
          $group-frame-maxXXXS={{
            l: '10.5%',
            columnGap: 'calc(49% - 58px)',
          }}
        >
          {allChats.map((chat) => {
            if (!chat.user || !chat.userServerId) return null

            return (
              <SidebarUserBubble
                key={chat.user.id}
                notification={chat.notification}
                user={chat.user}
                userServerId={chat.userServerId}
              />
            )
          })}
        </XStack>
      </YStack>

      <Spacer size="$12" />
    </YStack>
  )
}

const SidebarUserBubble = (props: UserBubbleProps) => {
  const currentUserServerIdEmitter = useCurrentUserServerIdEmitter()
  const isActive = useEmitterSelector(
    currentUserServerIdEmitter,
    (id) => id === props.userServerId
  )

  return (
    <View pointerEvents="auto" my="$3">
      <UserBubble active={isActive} {...props} />
    </View>
  )
}

// const SidebarUserListItem = ({
//   userServerId,
//   ...props
// }: UserListItemProps & { userServerId: string }) => {
//   const currentUserServerIdEmitter = useCurrentUserServerIdEmitter()
//   const isActive = useEmitterSelector(
//     currentUserServerIdEmitter,
//     (id) => id === userServerId
//   )

//   return <UserListItem variant="sidebar" size="small" active={isActive} {...props} />
// }
