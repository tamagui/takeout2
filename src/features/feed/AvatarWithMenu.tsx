import { Menu } from '@tamagui/menu'
import { useRouter } from 'one'
import { memo } from 'react'

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
      router.push(`/home/feed/profile/${userId}`)
    }

    return (
      <Menu allowFlip placement="bottom-start" offset={8}>
        <Menu.Trigger asChild>
          <Pressable
            cursor="pointer"
            position="relative"
            borderWidth={0}
            bg="transparent"
          >
            <Avatar gradient image={avatarUrl} name={username} size={32} />
          </Pressable>
        </Menu.Trigger>

        <Menu.Portal zIndex={100}>
          <Menu.Content
            transition="100ms ease-in-out"
            borderRadius="$4"
            enterStyle={{ scale: 0.9, opacity: 0, y: -5 }}
            exitStyle={{ scale: 0.95, opacity: 0, y: -3 }}
            elevate
          >
            {!isOwnProfile && (
              <>
                <Menu.Item
                  key="follow"
                  onSelect={onFollowToggle}
                  justify="space-between"
                  textValue={isFollowing ? 'Unfollow' : 'Follow'}
                >
                  <Menu.ItemTitle>{isFollowing ? 'Unfollow' : 'Follow'}</Menu.ItemTitle>
                  <Menu.ItemIcon
                    ios={{
                      name: isFollowing ? 'heart.fill' : 'heart',
                      pointSize: 18,
                    }}
                    androidIconName={isFollowing ? 'ic_menu_delete' : 'ic_menu_add'}
                  >
                    <HeartIcon size={18} color="$color10" />
                  </Menu.ItemIcon>
                </Menu.Item>

                <Menu.Separator />
              </>
            )}

            <Menu.Item
              key="view-profile"
              onSelect={handleViewProfile}
              justify="space-between"
              textValue="View Profile"
            >
              <Menu.ItemTitle>View Profile</Menu.ItemTitle>
              <Menu.ItemIcon
                ios={{
                  name: 'person.crop.circle',
                  pointSize: 18,
                }}
                androidIconName="ic_menu_myplaces"
              >
                <UserIcon size={18} color="$color10" />
              </Menu.ItemIcon>
            </Menu.Item>
          </Menu.Content>
        </Menu.Portal>
      </Menu>
    )
  }
)
