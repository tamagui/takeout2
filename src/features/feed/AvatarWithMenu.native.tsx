import { Image } from 'expo-image'
import { router } from 'one'
import { memo } from 'react'
import { AnimatePresence, View } from 'tamagui'
import { Pressable } from '~/interface/buttons/Pressable'
import { PlusIcon } from '~/interface/icons/phosphor/PlusIcon'

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

    const handleFollowClick = (e: any) => {
      e.stopPropagation()
      onFollowToggle?.()
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
        {/* comment out the plus button atm */}
        {/* <AnimatePresence>
          {!isOwnProfile && !isFollowing && (
            <Pressable
              key="follow-button"
              position="absolute"
              b={-3}
              r={-6}
              bg="$color"
              rounded={100}
              p={1}
              borderWidth={1}
              borderColor="$color1"
              onPress={handleFollowClick}
              animation="bouncy"
              enterStyle={{
                opacity: 0,
                scale: 0.5,
              }}
              exitStyle={{
                opacity: 0,
                scale: 0.5,
              }}
              pressStyle={{
                scale: 0.9,
              }}
            >
              <PlusIcon size={12} color="$color2" />
            </Pressable>
          )}
        </AnimatePresence> */}
      </View>
    )
  }
)
