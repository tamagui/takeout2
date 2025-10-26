import { Image } from 'expo-image'
import { memo, useMemo, useState } from 'react'
import { Accordion, SizableText, Spacer, View, XStack, YStack } from 'tamagui'
import type { Post } from '~/data/models'
import { formatDistanceToNow } from '~/helpers/date/formatDate'
import { ButtonSimple } from '~/interface/buttons/ButtonSimple'
import { ArrowUpIcon } from '~/interface/icons/phosphor/ArrowUpIcon'
import { ChatCircleDotsIcon } from '~/interface/icons/phosphor/ChatCircleDotsIcon'
import { DotsThreeIcon } from '~/interface/icons/phosphor/DotsThreeIcon'
import { HandCoinsIcon } from '~/interface/icons/phosphor/HandCoinsIcon'
import { HeartIcon } from '~/interface/icons/phosphor/HeartIcon'
import { MagicWandIcon } from '~/interface/icons/phosphor/MagicWandIcon'
import { DoubleTap } from '~/interface/interactions/DoubleTap'
import { LinearGradientSeparator } from '~/interface/separators/LinearGradientSeparator'
import { showPostActionSheet } from '~/interface/sheet/postActionSheetHelper'
import { BodyText } from '~/interface/text/Body'
import { useQuery, zero } from '~/zero/client'
import { useStatsigClient } from '~/features/feature-flags/usePostHog'
import { FEATURE_FLAGS } from '../feature-flags'
import { useUser } from '../user/useUser'
import { AvatarWithMenu } from './AvatarWithMenu'
import { InteractButton } from './InteractButton'
import {
  getRandomCaption,
  getRandomCommentCount,
  getRandomMagicWandCount,
} from './mockData'
import { formatEarnings } from './types'
import { useFollow } from './useFollow'
import { useLike } from './useLike'

interface PostCardProps {
  post: Post
}

export const PostCard = memo(({ post }: PostCardProps) => {
  const { user } = useUser()
  const { client } = useStatsigClient()
  const authorId = post.userId
  // Always load author since we're not showing character info for now
  const [author] = useQuery(zero.query.userPublic.where('id', authorId).one(), {
    enabled: !!authorId,
  })
  // TODO: Re-enable character avatar/username when character profile page is implemented
  // For now, only show author information
  const avatarUrl = author?.image
  const username = author?.username
  const { hasLiked, toggleLike } = useLike(user?.id, post.id)
  const [isTruncated, setIsTruncated] = useState<boolean>(false)

  // check if viewing own content (own user profile)
  const isOwnProfile = authorId === user?.id

  // use the real follow functionality with username for better toast messages
  const { isFollowing, toggleFollow } = useFollow(authorId, username)
  // generate random mock data once per post
  const mockData = useMemo(
    () => ({
      caption: getRandomCaption(),
      commentCount: getRandomCommentCount(),
      magicWandCount: getRandomMagicWandCount(),
    }),
    []
  )

  // get all feature flags for this component
  const features = {
    showCryptoEarnings: client.checkGate(FEATURE_FLAGS.CRYPTO_SHOW_EARNINGS),
    showCommentButton: client.checkGate(FEATURE_FLAGS.FEED_SHOW_COMMENT_BUTTON),
    showMagicWandButton: client.checkGate(FEATURE_FLAGS.FEED_SHOW_MAGIC_WAND),
  }

  return (
    <YStack>
      {/* header */}
      <XStack items="center" justify="space-between" pb="$2" px="$3">
        <XStack items="center" gap="$3">
          <AvatarWithMenu
            avatarUrl={avatarUrl}
            userId={authorId}
            username={username as string}
            isFollowing={isFollowing}
            isOwnProfile={isOwnProfile}
            onFollowToggle={toggleFollow}
          />
          <YStack flex={1}>
            <XStack items="center" gap="$2">
              <SizableText size="$4" fontWeight="600">
                {username}
              </SizableText>

              <Spacer flex />

              {features.showCryptoEarnings && (
                <XStack gap="$2">
                  <ButtonSimple
                    theme="green"
                    variant="outlined"
                    size="small"
                    active
                    px="$2.5"
                    gap="$1"
                    icon={<ArrowUpIcon size={14} />}
                  >
                    <ButtonSimple.Text color="$color">
                      {formatEarnings(525)}
                    </ButtonSimple.Text>
                  </ButtonSimple>

                  <ButtonSimple icon={HandCoinsIcon} theme="accent" size="small" px="$3">
                    Buy
                  </ButtonSimple>
                </XStack>
              )}
            </XStack>
          </YStack>
        </XStack>
      </XStack>

      {/* Post image */}
      <View width="100%" position="relative">
        <DoubleTap
          onDoubleTap={() => {
            toggleLike()
          }}
        >
          <Image
            source={post.image}
            style={{ width: '100%', aspectRatio: 3 / 4 }}
            contentFit="cover"
            transition={200}
            recyclingKey={post.id}
          />
        </DoubleTap>
      </View>

      {/* Stats */}
      <XStack px="$3" items="center" gap="$3" py="$2.5" justify="space-between">
        <XStack gap="$3">
          <InteractButton
            icon={HeartIcon}
            count={post.likesCount}
            onPress={toggleLike}
            active={hasLiked}
          />
          {features.showCommentButton && (
            <InteractButton
              icon={ChatCircleDotsIcon}
              count={mockData.commentCount || 0}
            />
          )}
          {features.showMagicWandButton && (
            <InteractButton icon={MagicWandIcon} count={mockData.magicWandCount || 0} />
          )}
        </XStack>
        <XStack gap="$2">
          <ButtonSimple
            circular
            variant="outlined"
            icon={<DotsThreeIcon size={16} color="$color12" />}
            onPress={() => showPostActionSheet(post, isOwnProfile)}
          />
        </XStack>
      </XStack>
      {/* Caption */}
      <XStack justify="space-between" flex={1} px="$3" gap="$1">
        <YStack flex={1}>
          <Accordion overflow="hidden" type="multiple">
            <Accordion.Item value="caption">
              <Accordion.Trigger unstyled disabled={!isTruncated}>
                {({ open }: { open: boolean }) => (
                  <BodyText
                    color="$color12"
                    numberOfLines={open ? undefined : 3}
                    flex={1}
                    onTextLayout={(e) => {
                      if (e.nativeEvent.lines.length >= 3) {
                        setIsTruncated(true)
                      }
                    }}
                  >
                    {post.caption || mockData.caption}
                  </BodyText>
                )}
              </Accordion.Trigger>
              <Accordion.HeightAnimator animation="200ms">
                <Accordion.Content animation="200ms" exitStyle={{ opacity: 0 }} />
              </Accordion.HeightAnimator>
            </Accordion.Item>
          </Accordion>
        </YStack>
        <SizableText size="$2" color="$color10">
          {formatDistanceToNow(post.createdAt)}
        </SizableText>
      </XStack>

      {/* Separator at the end */}
      <YStack py="$6">
        <LinearGradientSeparator />
      </YStack>
    </YStack>
  )
})
