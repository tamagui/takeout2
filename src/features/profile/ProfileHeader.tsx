import { memo } from 'react'
import { Linking } from 'react-native'
import { Circle, SizableText, useWindowDimensions, View, XStack, YStack } from 'tamagui'
import { SERVER_URL } from '~/constants/server-urls'
import type { User, UserStats } from '~/data/models'
import { FEATURE_FLAGS } from '~/features/feature-flags'
import { formatCount } from '~/helpers/number/formatNumber'
import { useShareProfile } from '~/helpers/share/useShareProfile'
import { useStatsigClient } from '~/features/feature-flags/usePostHog'
import { SimpleAvatar } from '~/interface/avatars/SimpleAvatar'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { Pressable } from '~/interface/buttons/Pressable'
import { CheckIcon } from '~/interface/icons/phosphor/CheckIcon'
import { HandCoinsIcon } from '~/interface/icons/phosphor/HandCoinsIcon'
import { PencilSimpleIcon } from '~/interface/icons/phosphor/PencilSimpleIcon'
import { PlusIcon } from '~/interface/icons/phosphor/PlusIcon'
import { ShareFatIcon } from '~/interface/icons/phosphor/ShareFatIcon'
import { SOCIAL_PLATFORMS } from '~/interface/social-media/platforms'
import { BodyText, TinyText } from '~/interface/text/Body'
import { H4 } from '~/interface/text/Headings'
import { useFollow } from '../feed/useFollow'
import { Link } from '../routing/Link'

interface ProfileHeaderProps {
  userInfo?: User
  isOwnProfile: boolean
  isFollowing?: boolean
  followersCount?: number
  followingCount?: number
  postsCount?: number
  stats?: UserStats
}

export const ProfileHeader = memo(
  ({
    userInfo,
    isOwnProfile,
    followersCount,
    followingCount,
    postsCount,
    stats,
  }: ProfileHeaderProps) => {
    // Use the follow hook for non-own profiles
    const { isFollowing, toggleFollow } = useFollow(
      !isOwnProfile ? userInfo?.id : undefined,
      userInfo?.username
    )

    const { width } = useWindowDimensions()
    const { client } = useStatsigClient()
    const { shareProfile } = useShareProfile()

    const CARD_SIZE = (width - 28) / 3

    // Feature flag for crypto trading
    const showCryptoTrading = client.checkGate(
      FEATURE_FLAGS.PROFILE_ENABLE_CRYPTO_TRADING
    )

    // Get social links from user data
    const socialLinks = userInfo?.socialLinks || {}

    // Handle share functionality
    const handleShare = async () => {
      if (!userInfo) return

      const publicProfileUrl = `${SERVER_URL}/u/${userInfo.username}`
      await shareProfile(userInfo, publicProfileUrl)
    }

    // Get the first 3 social links and count remaining
    const allSocialKeys = Object.keys(socialLinks)
    const visibleSocials = allSocialKeys.slice(0, 3)
    const remainingCount = allSocialKeys.length > 3 ? allSocialKeys.length - 3 : 0

    return (
      <View bg="$background" px={14} py="$3">
        <YStack gap="$4">
          {/* Profile Info Section */}
          <XStack items="center" gap="$5">
            {/* Avatar */}
            <SimpleAvatar src={userInfo?.image} size={64} />

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
                    {formatCount(followersCount || 0)}
                  </SizableText>
                  <SizableText size="$2" color="$color11">
                    Followers
                  </SizableText>
                </YStack>
                <YStack items="flex-start">
                  <SizableText size="$6" fontWeight="700">
                    {formatCount(followingCount || 0)}
                  </SizableText>
                  <SizableText size="$2" color="$color11">
                    Following
                  </SizableText>
                </YStack>
              </XStack>
            </YStack>
          </XStack>

          {/* Username and Bio */}
          {userInfo?.bio && (
            <YStack gap="$1">
              <BodyText size="$3" color="$color12" numberOfLines={2}>
                {userInfo.bio}
              </BodyText>
            </YStack>
          )}
          {/* Social Links - Stacked Avatar Style */}
          {visibleSocials.length > 0 && (
            <XStack items="center" gap="$1">
              <XStack>
                {visibleSocials.map((platformId, index) => {
                  const platform = SOCIAL_PLATFORMS[platformId]
                  if (!platform) return null

                  const icon = platform.icon
                  return (
                    <Pressable
                      key={platformId}
                      onPress={() => {
                        // Open social link URL directly
                        const url = socialLinks[platformId]
                        if (url) {
                          Linking.openURL(url)
                        }
                      }}
                      style={{
                        marginLeft: index > 0 ? -8 : 0,
                      }}
                    >
                      <Circle
                        size={33}
                        bg="$color3"
                        borderWidth={2}
                        borderColor="$background"
                        items="center"
                        justify="center"
                      >
                        <SizableText fontSize={16}>{icon}</SizableText>
                      </Circle>
                    </Pressable>
                  )
                })}

                {/* Show +count if there are more social links */}
                {remainingCount > 0 && (
                  <Circle
                    size={33}
                    bg="$color3"
                    borderWidth={2}
                    borderColor="$background"
                    items="center"
                    justify="center"
                    ml={-8}
                  >
                    <TinyText size="$1" fontWeight="600">
                      +{remainingCount}
                    </TinyText>
                  </Circle>
                )}
              </XStack>
            </XStack>
          )}

          {/* Action Buttons */}
          <XStack gap="$2">
            {isOwnProfile ? (
              <>
                {showCryptoTrading ? (
                  <Link asChild href="/profile/trade" style={{ flex: 1 }}>
                    <ButtonSimple
                      theme="green"
                      size="small"
                      flex={1}
                      icon={HandCoinsIcon}
                    >
                      <ButtonSimple.Text color="$color10">Trade</ButtonSimple.Text>
                    </ButtonSimple>
                  </Link>
                ) : (
                  <ButtonSimple
                    size="small"
                    flex={1}
                    icon={ShareFatIcon}
                    onPress={handleShare}
                  >
                    Share
                  </ButtonSimple>
                )}
                <Link asChild href="/user/profile-edit" style={{ flex: 1 }}>
                  <ButtonSimple size="small" flex={1} icon={PencilSimpleIcon}>
                    Edit Profile
                  </ButtonSimple>
                </Link>
              </>
            ) : (
              <>
                {showCryptoTrading ? (
                  <ButtonSimple theme="green" size="small" flex={1} icon={HandCoinsIcon}>
                    <ButtonSimple.Text color="$color10">Trade</ButtonSimple.Text>
                  </ButtonSimple>
                ) : (
                  <ButtonSimple
                    size="small"
                    flex={1}
                    icon={ShareFatIcon}
                    onPress={handleShare}
                  >
                    Share
                  </ButtonSimple>
                )}
                <ButtonSimple
                  size="small"
                  flex={1}
                  icon={isFollowing ? CheckIcon : PlusIcon}
                  onPress={toggleFollow}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </ButtonSimple>
              </>
            )}
          </XStack>

          {/* Market table - only show if crypto trading is enabled */}
          {showCryptoTrading && (
            <YStack borderWidth={1} borderColor="$borderColor" rounded="$6">
              {/* First row */}
              <XStack borderBottomWidth={1} borderColor="$borderColor" p="$3" gap="$3">
                <XStack items="center">
                  <SimpleAvatar src={userInfo?.image} size={44} />
                </XStack>
                <YStack flex={1}>
                  <XStack justify="space-between">
                    <BodyText>0.00</BodyText>
                    <BodyText color="$color12">$0.00</BodyText>
                  </XStack>
                  <XStack justify="space-between">
                    <BodyText color="$color9">${userInfo?.username}</BodyText>
                    <BodyText color="$color9">0.00%</BodyText>
                  </XStack>
                </YStack>
              </XStack>
              {/* Second row */}
              <XStack px="$3">
                <YStack justify="center" items="center" py="$3" flex={1}>
                  <H4 theme="green" color="$color10" fontWeight="500">
                    $0
                  </H4>
                  <BodyText color="$color9">Market Cap</BodyText>
                </YStack>
                <YStack
                  justify="center"
                  items="center"
                  borderRightWidth={1}
                  borderLeftWidth={1}
                  borderColor="$borderColor"
                  flex={1}
                >
                  <H4 color="$color12" fontWeight="500">
                    $0
                  </H4>
                  <BodyText color="$color9">Volume</BodyText>
                </YStack>
                <YStack justify="center" items="center" flex={1}>
                  <H4 color="$color12" fontWeight="500">
                    $0
                  </H4>
                  <BodyText color="$color9">Holders</BodyText>
                </YStack>
              </XStack>
            </YStack>
          )}
        </YStack>
      </View>
    )
  }
)
