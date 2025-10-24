import { memo, type ReactNode } from 'react'
import { ContextMenu, Button } from '@expo/ui/swift-ui'
import { showToast } from '~/interface/toast/Toast'
import { useUser } from '~/features/user/useUser'
import { useFriendship } from '~/features/user/useFriendship'
import { removeFriendship } from '~/features/user/removeFriendship'
import { zero } from '~/zero/client'
import type { UserWithRoles } from '~/data/types'

interface UserAvatarContextProps {
  targetUser: UserWithRoles | null
  children: ReactNode
}

export const UserAvatarContext = memo(
  ({ targetUser, children }: UserAvatarContextProps) => {
    const { user: currentUser } = useUser()
    const [friendship, friendshipStatus] = useFriendship(
      { id: currentUser?.id || '' },
      targetUser
    )

    if (!targetUser || !currentUser) {
      return <>{children}</>
    }

    const isOwnProfile = targetUser.id === currentUser.id

    const handleAddFriend = async () => {
      try {
        await Promise.all([
          zero.mutate.friendship.insert({
            accepted: false,
            acceptingId: targetUser.id,
            createdAt: Date.now(),
            requestingId: currentUser.id,
          }),
          zero.mutate.friendship.insert({
            accepted: false,
            acceptingId: currentUser.id,
            createdAt: Date.now(),
            requestingId: targetUser.id,
          }),
        ])
        showToast('Friend request sent!')
      } catch (error) {
        console.error('Failed to send friend request:', error)
        showToast('Failed to send friend request')
      }
    }

    const handleRemoveFriend = async () => {
      if (!friendship) {
        showToast('No friendship found')
        return
      }

      try {
        await removeFriendship(friendship)
        showToast('Friend removed')
      } catch (error) {
        console.error('Failed to remove friend:', error)
        showToast('Failed to remove friend')
      }
    }

    const handleViewProfile = () => {
      showToast(`View profile: ${targetUser.username || targetUser.name}`)
    }

    const handleUserSettings = () => {
      showToast('User settings coming soon')
    }

    if (isOwnProfile) {
      return (
        <ContextMenu>
          <ContextMenu.Items>
            <Button systemImage="gearshape" onPress={handleUserSettings}>
              User Settings
            </Button>
          </ContextMenu.Items>
          <ContextMenu.Trigger>{children}</ContextMenu.Trigger>
        </ContextMenu>
      )
    }

    return (
      <ContextMenu>
        <ContextMenu.Items>
          {friendshipStatus === 'not-friend' && (
            <Button systemImage="plus" onPress={handleAddFriend}>
              Add Friend
            </Button>
          )}
          {friendshipStatus === 'requested' && (
            <Button systemImage="clock" disabled>
              Friend Request Pending
            </Button>
          )}
          {friendshipStatus === 'accepted' && (
            <Button systemImage="person.badge.minus" onPress={handleRemoveFriend}>
              Remove Friend
            </Button>
          )}
          <Button systemImage="person" onPress={handleViewProfile}>
            View Profile
          </Button>
        </ContextMenu.Items>
        <ContextMenu.Trigger>{children}</ContextMenu.Trigger>
      </ContextMenu>
    )
  }
)
