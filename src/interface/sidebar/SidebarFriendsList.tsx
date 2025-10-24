import { memo } from 'react'
import { Plus } from '@tamagui/lucide-icons'
import { Spacer, YStack } from 'tamagui'
import { useCurrentServer } from '~/features/server/useCurrentServer'
import { getPrivateChatLink } from '~/features/user/getPrivateChatLink'
import { UserListItem } from '~/features/user/ui/UserListItem'
import { useFriends } from '~/features/user/useFriends'
import { useUser } from '~/features/user/useUser'
import { ButtonSimple } from '../buttons/ButtonSimple'
import { dialogAddFriend } from '../dialogs/actions'
import { ensureSignedUp } from '../dialogs/isSignedUpEmitter'
import { Link } from '../app/Link'
import { ListTitle } from '../lists/ListTitle'
import { ListItem } from '../lists/ListItem'

export const SidebarFriendsList = memo(() => {
  const friends = useFriends()
  const { user } = useUser()
  const { serverId, channelId, privateChatUser } = useCurrentServer()

  if (!user) {
    return null
  }

  return null
  // return (
  //   <YStack minH="max-content">
  //     <ListTitle>
  //       <ListTitle.Text>Friends</ListTitle.Text>

  //       <ListItem.After>
  //         <ButtonSimple
  //           mr={-8}
  //           variant="transparent"
  //           tooltip="Add friend"
  //           onPress={() => {
  //             if (!ensureSignedUp()) return
  //             dialogAddFriend()
  //           }}
  //         >
  //           <Plus size={12} opacity={0.3} />
  //         </ButtonSimple>
  //       </ListItem.After>
  //     </ListTitle>

  //     <YStack>
  //       {friends?.map((friend) => (
  //         <Link
  //           key={friend.id}
  //           href={getPrivateChatLink({
  //             requestingId: user.id,
  //             acceptingId: friend.id,
  //             serverId,
  //             channelId,
  //           })}
  //         >
  //           <UserListItem
  //             active={privateChatUser?.id === friend.id}
  //             variant="sidebar"
  //             user={friend}
  //           />
  //         </Link>
  //       ))}
  //     </YStack>

  //     <Spacer size="$12" />
  //   </YStack>
  // )
})
