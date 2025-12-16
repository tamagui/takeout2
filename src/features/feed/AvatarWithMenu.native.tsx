import { useRouter } from 'one'
import { memo } from 'react'
import * as DropdownMenu from 'zeego/dropdown-menu'

import { Avatar } from '~/interface/avatars/Avatar'
import { Pressable } from '~/interface/buttons/Pressable'
import { HeartIcon } from '~/interface/icons/phosphor/HeartIcon'
import { UserIcon } from '~/interface/icons/phosphor/UserIcon'

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
      router.push(`/home/profile/${userId}`)
    }

    return (
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <Pressable cursor="pointer" position="relative">
            <Avatar image={avatarUrl} name={username} size={32} />
          </Pressable>
        </DropdownMenu.Trigger>

        <DropdownMenu.Content>
          {!isOwnProfile && (
            <>
              <DropdownMenu.Item key="follow" onSelect={onFollowToggle}>
                <DropdownMenu.ItemIcon
                  ios={{
                    name: isFollowing ? 'heart.fill' : 'heart',
                    pointSize: 18,
                  }}
                >
                  <HeartIcon size={16} />
                </DropdownMenu.ItemIcon>
                <DropdownMenu.ItemTitle>
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </DropdownMenu.ItemTitle>
              </DropdownMenu.Item>

              <DropdownMenu.Separator />
            </>
          )}

          <DropdownMenu.Item key="view-profile" onSelect={handleViewProfile}>
            <DropdownMenu.ItemIcon
              ios={{
                name: 'person.crop.circle',
                pointSize: 18,
              }}
            >
              <UserIcon size={16} />
            </DropdownMenu.ItemIcon>
            <DropdownMenu.ItemTitle>View Profile</DropdownMenu.ItemTitle>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    )
  }
)
