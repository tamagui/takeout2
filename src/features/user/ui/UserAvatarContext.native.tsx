import { memo, type ReactNode } from 'react'
import { ContextMenu, Button } from '@expo/ui/swift-ui'
import { showToast } from '~/interface/toast/Toast'
import { useUser } from '~/features/user/useUser'
import type { User } from '~/data/models'

interface UserAvatarContextProps {
  targetUser: User | null
  children: ReactNode
}

export const UserAvatarContext = memo(
  ({ targetUser, children }: UserAvatarContextProps) => {
    const { user: currentUser } = useUser()

    if (!targetUser || !currentUser) {
      return <>{children}</>
    }

    const isOwnProfile = targetUser.id === currentUser.id

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
          <Button systemImage="person" onPress={handleViewProfile}>
            View Profile
          </Button>
        </ContextMenu.Items>
        <ContextMenu.Trigger>{children}</ContextMenu.Trigger>
      </ContextMenu>
    )
  }
)
