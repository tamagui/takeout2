import { formatDistanceToNow } from '@take-out/helpers'
import { router } from 'one'
import { memo, useState } from 'react'
import { Accordion, isWeb, SizableText, View, XStack, YStack } from 'tamagui'

import { useAuth } from '~/features/auth/client/authClient'
import { useUser } from '~/hooks/useUser'
import { Pressable } from '~/interface/buttons/Pressable'
import { ChatCircleIcon } from '~/interface/icons/phosphor/ChatCircleIcon'
import { DotIcon } from '~/interface/icons/phosphor/DotIcon'
import { Text } from '~/interface/text/Text'

import { AvatarWithMenu } from './AvatarWithMenu'
import { PostActionMenu } from './PostActionMenu'
import { PostActionsPopover } from './PostActionsPopover'
import { PostImage } from './PostImage'

import type { Post } from '~/data/types'

interface PostCardProps {
  post: Post
}

export const PostCard = memo(({ post }: PostCardProps) => {
  const { user } = useAuth()
  const authorId = post.userId
  const [author] = useUser(authorId)
  const avatarUrl = author?.image
  const username = author?.username

  const [isTruncated, setIsTruncated] = useState<boolean>(false)
  const [aspectRatio, setAspectRatio] = useState<number>(1)
  const isOwnProfile = authorId === user?.id

  return (
    <View
      mt="$2"
      pb="$4"
      data-testid={`post-card-${post.id}`}
      $platform-web={{
        rounded: '$6',
        py: '$4',
        maxW: 540,
        mx: 'auto',
        width: '100%',
      }}
    >
      <View px="$4">
        <XStack items="center" justify="space-between" pb="$2">
          <XStack gap="$3" width="100%">
            <AvatarWithMenu
              avatarUrl={avatarUrl || ''}
              userId={authorId}
              username={username || ''}
              isOwnProfile={isOwnProfile}
            />
            <YStack flex={1} gap="$2">
              <XStack items="center" justify="space-between">
                <XStack items="center" gap="$1">
                  <SizableText size="$4" fontWeight="600" numberOfLines={1}>
                    {username}
                  </SizableText>
                  <DotIcon size={16} color="$color10" />
                  <SizableText size="$3" color="$color10">
                    {formatDistanceToNow(post.createdAt)}
                  </SizableText>
                </XStack>
                {/* Todo: move to tamagui Menu (v2) */}
                {isWeb ? (
                  <PostActionsPopover post={post} isOwnPost={isOwnProfile} />
                ) : (
                  <PostActionMenu post={post} isOwnPost={isOwnProfile} />
                )}
              </XStack>
            </YStack>
          </XStack>
        </XStack>
        <View>
          <Accordion overflow="hidden" type="multiple">
            <Accordion.Item value="caption" bg="transparent" borderWidth={0} p={0}>
              <Accordion.Trigger
                unstyled
                disabled={!isTruncated}
                p={0}
                bg="transparent"
                borderWidth={0}
              >
                {({ open }: { open: boolean }) => (
                  <Text
                    numberOfLines={open ? undefined : 3}
                    flex={1}
                    flexBasis="auto"
                    text="left"
                    {...(!isWeb && {
                      onTextLayout: (e: { nativeEvent: { lines: unknown[] } }) => {
                        if (e.nativeEvent.lines.length >= 3) {
                          setIsTruncated(true)
                        }
                      },
                    })}
                  >
                    {post.caption}
                  </Text>
                )}
              </Accordion.Trigger>
              <Accordion.HeightAnimator transition="200ms">
                <Accordion.Content transition="200ms" exitStyle={{ opacity: 0 }} />
              </Accordion.HeightAnimator>
            </Accordion.Item>
          </Accordion>
          <View width="100%" position="relative" mt="$2">
            <Pressable
              onPress={() =>
                router.push(`/home/feed/post/${post.id}?username=${username}`)
              }
            >
              <PostImage
                postId={post.id}
                image={post.image}
                caption={post.caption}
                aspectRatio={aspectRatio}
                onAspectRatioChange={setAspectRatio}
              />
            </Pressable>
          </View>
          {typeof post.commentCount === 'number' && (
            <XStack items="center" gap="$1" pt="$2">
              <ChatCircleIcon size={18} color="$color11" />
              <SizableText size="$3" color="$color11" fontWeight="bold">
                {post.commentCount}
              </SizableText>
            </XStack>
          )}
        </View>
      </View>
    </View>
  )
})
