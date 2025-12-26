import { router } from 'one'
import { memo } from 'react'
import { SizableText, View, XStack, YStack } from 'tamagui'

import { SERVER_URL } from '~/constants/urls'
import { formatCount, formatReactionCount } from '~/helpers/number/formatNumber'
import { useShareProfile } from '~/helpers/share/useShareProfile'
import { Avatar } from '~/interface/avatars/Avatar'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { PencilSimpleIcon } from '~/interface/icons/phosphor/PencilSimpleIcon'
import { ShareFatIcon } from '~/interface/icons/phosphor/ShareFatIcon'
import { Text } from '~/interface/text/Text'

import type { User } from '~/data/types'

interface ProfileHeaderProps {
  userInfo?: User
  isOwnProfile: boolean
  postsCount?: number
}

const StatItem = ({ value, label }: { value: string; label: string }) => (
  <YStack items="center" gap="$1">
    <SizableText size="$6" fontWeight="700">
      {value}
    </SizableText>
    <SizableText size="$2" color="$color11">
      {label}
    </SizableText>
  </YStack>
)

export const ProfileHeader = memo(
  ({ userInfo, isOwnProfile, postsCount }: ProfileHeaderProps) => {
    const { shareProfile } = useShareProfile()

    const handleShare = async () => {
      if (!userInfo) return
      const publicProfileUrl = `${SERVER_URL}/u/${userInfo.username}`
      await shareProfile(userInfo, publicProfileUrl)
    }

    return (
      <View py="$6">
        <YStack gap="$5" items="center">
          <Avatar
            image={userInfo?.image || ''}
            name={userInfo?.name ?? userInfo?.username ?? 'User'}
            size={120}
          />

          <YStack gap="$2" items="center">
            <Text size="$7" fontWeight="600">
              {userInfo?.name || userInfo?.username}
            </Text>
            {userInfo?.name && (
              <SizableText size="$4" color="$color11">
                @{userInfo?.username}
              </SizableText>
            )}
          </YStack>

          <XStack gap="$8" py="$2">
            <StatItem value={formatCount(postsCount || 0)} label="Posts" />
            <StatItem value={formatReactionCount(1200)} label="Followers" />
            <StatItem value={formatReactionCount(14555)} label="Following" />
          </XStack>

          <XStack gap="$3" pt="$2">
            <ButtonSimple
              size="medium"
              variant="outlined"
              onPress={handleShare}
              icon={<ShareFatIcon size={16} color="$color12" />}
            >
              Share
            </ButtonSimple>
            {isOwnProfile && (
              <ButtonSimple
                size="medium"
                variant="outlined"
                onPress={() => router.push('/settings/edit-profile')}
                icon={<PencilSimpleIcon size={16} color="$color12" />}
              >
                Edit Profile
              </ButtonSimple>
            )}
          </XStack>
        </YStack>
      </View>
    )
  }
)
