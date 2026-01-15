import { useRouter } from 'one'
import { memo } from 'react'

import { Avatar } from '~/interface/avatars/Avatar'
// TODO: Tamagui v2 Menu!

interface AvatarWithMenuProps {
  avatarUrl?: string
  userId: string
  username: string
  isFollowing?: boolean
  isOwnProfile?: boolean
  onFollowToggle?: () => void
}

export const AvatarWithMenu = memo(
  ({
    avatarUrl,
    userId,
    username,
    isFollowing = false,
    isOwnProfile = false,
    onFollowToggle,
  }: AvatarWithMenuProps) => {
    const router = useRouter()

    const handleViewProfile = () => {
      router.push(`/home/feed/profile/${userId}`)
    }

    return <Avatar image={avatarUrl} name={username} size={32} />
  }
)
