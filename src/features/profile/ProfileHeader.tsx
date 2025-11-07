import { memo, useId } from 'react'
import { SizableText, View, XStack, YStack } from 'tamagui'
import { SERVER_URL } from '~/constants/urls'
import type { User } from '~/data/types'
import { formatCount } from '~/helpers/number/formatNumber'
import { useShareProfile } from '~/helpers/share/useShareProfile'
import { Avatar } from '~/interface/avatars/Avatar'
import { SocialLinks } from '~/interface/social-media/platforms'
import { BodyText } from '~/interface/text/Body'

interface ProfileHeaderProps {
  userInfo?: User
  isOwnProfile: boolean
  postsCount?: number
}

export const ProfileHeader = memo(
  ({ userInfo, isOwnProfile, postsCount }: ProfileHeaderProps) => {
    const { shareProfile } = useShareProfile()
    const socialLinks = {
      twitter: `@${userInfo?.username}`,
      facebook: `@${userInfo?.username}`,
      instagram: `@${userInfo?.username}`,
      tiktok: `@${userInfo?.username}`,
    }

    // Handle share functionality
    const handleShare = async () => {
      if (!userInfo) return

      const publicProfileUrl = `${SERVER_URL}/u/${userInfo.username}`
      await shareProfile(userInfo, publicProfileUrl)
    }

    return (
      <View px={14} py="$3">
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
          {/* Social Links - Stacked Avatar Style */}
          <SocialLinks links={socialLinks} />
        </YStack>
      </View>
    )
  }
)
