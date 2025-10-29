import { memo } from 'react'
import { SizableText, useWindowDimensions, View, XStack, YStack } from 'tamagui'
import { SERVER_URL } from '~/constants/urls'
import type { User, UserProfile } from '~/data/models'
import { formatCount } from '~/helpers/number/formatNumber'
import { useShareProfile } from '~/helpers/share/useShareProfile'
import { Avatar } from '~/interface/avatars/Avatar'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { PencilSimpleIcon } from '~/interface/icons/phosphor/PencilSimpleIcon'
import { ShareFatIcon } from '~/interface/icons/phosphor/ShareFatIcon'
import { BodyText } from '~/interface/text/Body'
import { Link } from '../routing/Link'

interface ProfileHeaderProps {
  userInfo?: User
  isOwnProfile: boolean
  postsCount?: number
  profile?: UserProfile
}

export const ProfileHeader = memo(
  ({
    userInfo,
    isOwnProfile,
    postsCount,
    profile,
  }: ProfileHeaderProps) => {

    const { width } = useWindowDimensions()
    const { shareProfile } = useShareProfile()

    const CARD_SIZE = (width - 28) / 3

    // Handle share functionality
    const handleShare = async () => {
      if (!userInfo) return

      const publicProfileUrl = `${SERVER_URL}/u/${userInfo.username}`
      await shareProfile(userInfo, publicProfileUrl)
    }

    return (
      <View bg="$background" px={14} py="$3">
        <YStack gap="$4">
          {/* Profile Info Section */}
          <XStack items="center" gap="$5">
            <Avatar image={userInfo?.image || ''} size={64} />

            <YStack gap="$1" flex={1} pr="$4">
              {/* Username */}
              <BodyText color="$color12">{userInfo?.username}</BodyText>
              {/* Stats */}
              <XStack justify="space-between">
                <YStack items="flex-start">
                  <SizableText size="$6" fontWeight="700">
                    {formatCount(postsCount || 0)}
                  </SizableText>
                  <SizableText size="$2" color="$color11">
                    Posts
                  </SizableText>
                </YStack>
              </XStack>
            </YStack>
          </XStack>

          {/* Action Buttons */}
          <XStack gap="$2">
            <ButtonSimple
              size="small"
              flex={1}
              icon={ShareFatIcon}
              onPress={handleShare}
            >
              Share
            </ButtonSimple>
            {isOwnProfile && (
              <Link asChild href="/user/profile-edit" style={{ flex: 1 }}>
                <ButtonSimple size="small" flex={1} icon={PencilSimpleIcon}>
                  Edit Profile
                </ButtonSimple>
              </Link>
            )}
          </XStack>
        </YStack>
      </View>
    )
  }
)
