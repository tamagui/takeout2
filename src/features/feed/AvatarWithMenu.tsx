import { Image } from 'expo-image'
import { router } from 'one'
import { memo } from 'react'
import { View } from 'tamagui'
import { Pressable } from '~/interface/buttons/Pressable'

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
    isFollowing = false,
    isOwnProfile = false,
    onFollowToggle,
  }: AvatarWithMenuProps) => {
    const handleViewProfile = () => {
      if (isOwnProfile) {
        router.push('/profile')
      } else {
        router.push(`/home/profile/${userId}`)
      }
    }

    return (
      <View position="relative">
        <Pressable
          onPress={handleViewProfile}
          cursor="pointer"
          pressStyle={{ opacity: 0.8 }}
        >
          <Image
            source={{ uri: avatarUrl }}
            style={{ width: 32, height: 32, borderRadius: 100 }}
            recyclingKey={userId}
          />
        </Pressable>
      </View>
    )
  }
)
