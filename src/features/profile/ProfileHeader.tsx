import { router } from 'one'
import { memo } from 'react'
import { SizableText, View, XStack, YStack } from 'tamagui'
import { SERVER_URL } from '~/constants/urls'
import type { User } from '~/data/types'
import { formatCount, formatReactionCount } from '~/helpers/number/formatNumber'
import { useShareProfile } from '~/helpers/share/useShareProfile'
import { Avatar } from '~/interface/avatars/Avatar'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { PencilSimpleIcon } from '~/interface/icons/phosphor/PencilSimpleIcon'
import { ShareFatIcon } from '~/interface/icons/phosphor/ShareFatIcon'
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
      <View py="$3">
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
                <YStack items="flex-start">
                  <SizableText size="$6" fontWeight="700">
                    {formatReactionCount(1200)}
                  </SizableText>
                  <SizableText size="$2" color="$color11">
                    Followers
                  </SizableText>
                </YStack>
                <YStack items="flex-start">
                  <SizableText size="$6" fontWeight="700">
                    {formatReactionCount(14555)}
                  </SizableText>
                  <SizableText size="$2" color="$color11">
                    Following
                  </SizableText>
                </YStack>
              </XStack>
            </YStack>
          </XStack>
          {/* Social Links - Stacked Avatar Style */}
          <SocialLinks links={socialLinks} />
          <XStack gap="$2" flex={1}>
            <ButtonSimple
              size="medium"
              flex={1}
              glass
              onPress={handleShare}
              icon={<ShareFatIcon size={16} color="$color12" />}
            >
              Share
            </ButtonSimple>
            <ButtonSimple
              size="medium"
              flex={1}
              glass
              onPress={() => router.push('/setting/edit-profile')}
              icon={<PencilSimpleIcon size={16} color="$color12" />}
            >
              Edit Profile
            </ButtonSimple>
          </XStack>
          <XStack></XStack>
        </YStack>
      </View>
    )
  }
)
